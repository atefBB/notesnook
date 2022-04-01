import { useCallback, useEffect, useRef, useState } from "react";
import { Button, Flex, Text } from "rebass";
import * as Icon from "../icons";
import { db } from "../../common/db";
import Dialog from "./dialog";
import { showToast } from "../../utils/toast";
import Field from "../field";
import { store as notestore } from "../../stores/note-store";
import { useStore, store } from "../../stores/notebook-store";
import { getTotalNotes } from "../../common";
import Accordion from "../accordion";

function MoveDialog({ onClose, noteIds }) {
  const [selected, setSelected] = useState([]);

  const refreshNotebooks = useStore((store) => store.refresh);
  const getAllNotebooks = useCallback(() => {
    refreshNotebooks();
    return store.get().notebooks.filter((a) => a.type !== "header");
  }, [refreshNotebooks]);

  return (
    <Dialog
      isOpen={true}
      title={"Add to notebook"}
      description={"You can add a single note to multiple notebooks & topics."}
      onClose={onClose}
      width={"30%"}
      positiveButton={{
        text: "Finish",
        disabled: !selected.length,
        onClick: async () => {
          for (let item of selected) {
            try {
              if (item.type === "remove") {
                await db.notebooks
                  .notebook(item.id)
                  .topics.topic(item.topic)
                  .delete(...noteIds);
              } else if (item.type === "add") {
                await db.notes.move(item, ...noteIds);
              }
            } catch (e) {
              showToast("error", e.message);
              console.error(e);
            }
          }
          notestore.refresh();
          showToast(
            "success",
            `Added ${noteIds.length} notes to ${selected.length} topics`
          );
          onClose();
        },
      }}
      negativeButton={{
        text: "Cancel",
        onClick: onClose,
      }}
    >
      <Flex flexDirection="column" mt={1} sx={{ overflowY: "hidden" }}>
        <FilteredList
          testId="mnd-new-notebook-title"
          placeholders={{
            empty: "Add a new notebook",
            filter: "Filter notebooks",
          }}
          getAll={getAllNotebooks}
          filter={(notebooks, query) => db.lookup.notebooks(notebooks, query)}
          onCreateNewItem={(title) =>
            db.notebooks.add({
              title,
            })
          }
          refreshItems={refreshNotebooks}
          itemName="notebook"
          renderItem={(notebook, index) => {
            const selectedTopics = selected.filter((s) => s.id === notebook.id);
            return (
              <Accordion
                key={notebook.id}
                testId={`notebook-${index}`}
                title={
                  <Flex flexDirection={"column"} sx={{ px: 1 }}>
                    <Text variant={"body"}>{notebook.title}</Text>
                    <Text variant={"subBody"} fontWeight="normal">
                      {getTotalNotes(notebook)} notes &amp;{" "}
                      {notebook.topics.length} topics{" "}
                      {selectedTopics.length
                        ? ` & ${selectedTopics.length} selected`
                        : ""}
                    </Text>
                  </Flex>
                }
                sx={{ mb: 1 }}
              >
                <FilteredList
                  placeholders={{
                    empty: "Add a new topic",
                    filter: "Filter topics",
                  }}
                  testId="mnd-new-topic-title"
                  itemName="topic"
                  filter={(topics, query) => db.lookup.topics(topics, query)}
                  getAll={() => db.notebooks.notebook(notebook).topics.all}
                  onCreateNewItem={async (title) => {
                    await db.notebooks.notebook(notebook).topics.add(title);
                  }}
                  refreshItems={refreshNotebooks}
                  renderItem={(topic, topicIndex) => {
                    const isSelected = selected.find(
                      (s) => s.topic === topic.id
                    );
                    const hasNotes = topicHasNotes(topic, noteIds);

                    return (
                      <Item
                        data-test-id={`notebook-${index}-topic-${topicIndex}`}
                        key={topic.id}
                        onClick={() => {
                          const opType = topicHasNotes(topic, noteIds)
                            ? "remove"
                            : "add";
                          setSelected((s) => {
                            const copy = s.slice();
                            const index = copy.findIndex(
                              (i) => i.topic === topic.id
                            );
                            if (index === -1)
                              copy.push({
                                id: notebook.id,
                                topic: topic.id,
                                type: opType,
                              });
                            else copy.splice(index, 1);
                            return copy;
                          });
                        }}
                        indent={1}
                        icon={Icon.Topic}
                        title={topic.title}
                        totalNotes={topic.notes.length}
                        action={
                          isSelected && hasNotes ? (
                            <Icon.Close
                              title="Notes will be removed from this topic."
                              size={16}
                              color="error"
                            />
                          ) : hasNotes ? (
                            <Icon.DoubleCheckmark
                              title="Some of the notes are already in this topic."
                              size={16}
                              color="primary"
                            />
                          ) : isSelected ? (
                            <Icon.Checkmark
                              title="Notes will be added to this topic."
                              size={16}
                              color="primary"
                            />
                          ) : null
                        }
                      />
                    );
                  }}
                />
              </Accordion>
            );
          }}
        />
      </Flex>
    </Dialog>
  );
}

function topicHasNotes(topic, noteIds) {
  return noteIds.some((id) => topic.notes.indexOf(id) > -1);
}

function FilteredList({
  placeholders,
  testId,
  getAll,
  filter,
  onCreateNewItem,
  renderItem,
  refreshItems,
  itemName,
}) {
  const [items, setItems] = useState([]);
  const [query, setQuery] = useState();
  const noItemsFound = items.length <= 0 && query?.length > 0;
  const inputRef = useRef();

  const refresh = useCallback(() => {
    refreshItems();
    setItems(getAll());
  }, [refreshItems, getAll]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const _filter = useCallback(
    (query) => {
      setItems(() => {
        const items = getAll();
        if (!query) {
          return items;
        }
        return filter(items, query);
      });
      setQuery(query);
    },
    [getAll, filter]
  );

  const _createNewItem = useCallback(
    async (title) => {
      await onCreateNewItem(title);
      refresh();
      setQuery();
      inputRef.current.value = "";
    },
    [inputRef, refresh, onCreateNewItem]
  );

  return (
    <>
      <Field
        inputRef={inputRef}
        data-test-id={testId}
        autoFocus
        placeholder={
          items.length <= 0 ? placeholders.empty : placeholders.filter
        }
        onChange={(e) => {
          _filter(e.target.value);
        }}
        onKeyUp={async (e) => {
          if (e.key === "Enter" && noItemsFound) {
            await _createNewItem(query);
          }
        }}
        action={
          items.length <= 0
            ? {
                icon: Icon.Plus,
                onClick: async () => await _createNewItem(query),
              }
            : { icon: Icon.Search, onClick: () => _filter(query) }
        }
      />
      <Flex flexDirection="column" mt={1} sx={{ overflowY: "hidden" }}>
        {noItemsFound && (
          <Button
            variant={"secondary"}
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              py: 2,
            }}
            onClick={async () => {
              await _createNewItem(query);
            }}
          >
            <Text variant={"body"}>{`Add "${query}" ${itemName}`}</Text>
            <Icon.Plus size={16} color="primary" />
          </Button>
        )}
        {items.map(renderItem)}
      </Flex>
    </>
  );
}
export default MoveDialog;

function Item(props) {
  const { indent = 0, title, totalNotes, onClick, action } = props;
  return (
    <Button
      variant={"list"}
      data-test-id={props["data-test-id"]}
      p={1}
      justifyContent="space-between"
      alignItems="center"
      pl={!indent ? 2 : indent * 15}
      onClick={onClick}
      sx={{ display: "flex" }}
    >
      <Flex flexDirection="column">
        <Text variant="body">{title}</Text>
        <Text variant="subBody">{totalNotes + " notes"}</Text>
      </Flex>
      {action}
    </Button>
  );
}