import "../types";
import { getWeekGroupFromTimestamp, MONTHS_FULL } from "./date";

const MILLISECONDS_IN_DAY = 1000 * 60 * 60 * 24;
const MILLISECONDS_IN_WEEK = MILLISECONDS_IN_DAY * 7;

const comparators = {
  dateEdited: {
    asc: (a, b) => a.dateEdited - b.dateEdited,
    desc: (a, b) => b.dateEdited - a.dateEdited,
  },
  dateCreated: {
    asc: (a, b) => a.dateCreated - b.dateCreated,
    desc: (a, b) => b.dateCreated - a.dateCreated,
  },
  dateDeleted: {
    asc: (a, b) => a.dateDeleted - b.dateDeleted,
    desc: (a, b) => b.dateDeleted - a.dateDeleted,
  },
  title: {
    asc: (a, b) => getTitle(a).localeCompare(getTitle(b)),
    desc: (a, b) => getTitle(b).localeCompare(getTitle(a)),
  },
};

function getTitle(item) {
  return item.alias || item.title;
}

const KEY_SELECTORS = {
  abc: (item) => getFirstCharacter(item.alias || item.title),
  month: (item, groupBy, dateNow) => {
    dateNow.setTime(item[groupBy]);
    return MONTHS_FULL[dateNow.getMonth()];
  },
  week: (item, groupBy) => getWeekGroupFromTimestamp(item[groupBy]),
  year: (item, groupBy, dateNow) => {
    dateNow.setTime(item[groupBy]);
    return dateNow.getFullYear();
  },
  default: (item, groupBy, dateNow) => {
    const date = item[groupBy];
    return date > dateNow.getTime() - MILLISECONDS_IN_WEEK
      ? "Recent"
      : date > dateNow.getTime() - MILLISECONDS_IN_WEEK * 2
      ? "Last week"
      : "Older";
  },
};

/**
 * @param {any[]} array
 * @param {GroupOptions} options
 * @returns Grouped array
 */
export function groupArray(
  array,
  options = {
    groupBy: "default",
    sortBy: "dateEdited",
    sortDirection: "desc",
  }
) {
  const cachedDate = new Date();

  if (options.sortBy && options.sortDirection) {
    const selector = comparators[options.sortBy][options.sortDirection];
    array.sort(selector);
  }

  if (options.groupBy === "none") {
    const conflicted = [];
    const pinned = [];
    const others = [];
    for (const item of array) {
      if (item.pinned) {
        pinned.push(item);
        continue;
      } else if (item.conflicted) {
        conflicted.push(item);
        continue;
      } else others.push(item);
    }
    const groups = [];
    if (conflicted.length > 0)
      groups.push({ title: "Conflicted", type: "header" }, ...conflicted);
    if (pinned.length > 0)
      groups.push({ title: "Pinned", type: "header" }, ...pinned);
    if (others.length > 0)
      groups.push({ title: "All", type: "header" }, ...others);
    return groups;
  }

  const groups = new Map([
    ["Conflicted", []],
    ["Pinned", []],
  ]);

  const keySelector = KEY_SELECTORS[options.groupBy || "default"];
  array.forEach((item) => {
    if (item.pinned) {
      return addToGroup(groups, "Pinned", item);
    } else if (item.conflicted) return addToGroup(groups, "Conflicted", item);

    const groupTitle = keySelector(item, options.sortBy, cachedDate);
    addToGroup(groups, groupTitle, item);
  });

  let items = [];
  for (let [groupTitle, groupItems] of groups.entries()) {
    if (!groupItems.length) continue;

    let group = { title: groupTitle, type: "header" };
    items.push(group);
    groupItems.forEach((item) => items.push(item));
  }

  return items;
}

function addToGroup(groups, groupTitle, item) {
  const group = groups.get(groupTitle) || [];
  group.push(item);
  groups.set(groupTitle, group);
}

const REGEX = /\S/;
function getFirstCharacter(str) {
  if (!str) return "-";
  return REGEX.exec(str)[0].toUpperCase();
}