import React, { useEffect } from "react";
import ReactDOM from "react-dom";
import { getHomeRoute, NavigationEvents } from "../../navigation";
import { store as selectionStore } from "../../stores/selection-store";
import useRoutes from "../../utils/use-routes";
import RouteContainer from "../route-container";
import ThemeProvider from "../theme-provider";
import routes from "../../navigation/routes";

var cache = {};
function CachedRouter() {
  const [RouteResult, location] = useRoutes(routes, {
    fallbackRoute: getHomeRoute(),
    hooks: {
      beforeNavigate: () => selectionStore.toggleSelectionMode(false),
    },
  });

  useEffect(() => {
    if (!RouteResult) return;
    NavigationEvents.publish("onNavigate", RouteResult, location);
    window.currentViewType = RouteResult.type;
    window.currentViewKey = RouteResult.key;

    const key = RouteResult.key || "general";

    const routeContainer = document.getElementById("mainRouteContainer");
    routeContainer.childNodes.forEach((node) => {
      node.style.display = "none";
    });

    var route = document.getElementById(key);
    if (route) {
      route.style.display = "flex";
      if (key !== "general") return;
      else {
        route.remove();
        route = undefined;
      }
    }

    if (!cache[key]) {
      if (!route) {
        cache[key] = key !== "general";
        route = document.createElement("div");
        route.id = key;
        route.className = "route";
        routeContainer.appendChild(route);
      }
      ReactDOM.render(
        <ThemeProvider>{RouteResult.component}</ThemeProvider>,
        route
      );
    }
  }, [RouteResult, location]);

  return (
    <RouteContainer
      id="mainRouteContainer"
      type={RouteResult?.type}
      title={RouteResult?.title}
      subtitle={RouteResult?.subtitle}
      buttons={RouteResult?.buttons}
      isEditable={RouteResult?.isEditable}
      onChange={RouteResult?.onChange}
    />
  );
}

export function clearRouteCache() {
  cache = {};
}

export default CachedRouter;