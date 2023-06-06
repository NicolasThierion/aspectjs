import { defineClientConfig } from "@vuepress/client";
import ChartJS from "/home/nicolas/projects/aspectjs-next/docs/node_modules/vuepress-plugin-md-enhance/lib/client/components/ChartJS.js";
import CodeTabs from "/home/nicolas/projects/aspectjs-next/docs/node_modules/vuepress-plugin-md-enhance/lib/client/components/CodeTabs.js";
import { hasGlobalComponent } from "/home/nicolas/projects/aspectjs-next/docs/node_modules/vuepress-shared/lib/client/index.js";
import { CodeGroup, CodeGroupItem } from "/home/nicolas/projects/aspectjs-next/docs/node_modules/vuepress-plugin-md-enhance/lib/client/compact/index.js";
import "/home/nicolas/projects/aspectjs-next/docs/node_modules/vuepress-plugin-md-enhance/lib/client/styles/container/index.scss";
import CodeDemo from "/home/nicolas/projects/aspectjs-next/docs/node_modules/vuepress-plugin-md-enhance/lib/client/components/CodeDemo.js";
import ECharts from "/home/nicolas/projects/aspectjs-next/docs/node_modules/vuepress-plugin-md-enhance/lib/client/components/ECharts.js";
import "/home/nicolas/projects/aspectjs-next/docs/node_modules/vuepress-plugin-md-enhance/lib/client/styles/figure.scss";
import FlowChart from "/home/nicolas/projects/aspectjs-next/docs/node_modules/vuepress-plugin-md-enhance/lib/client/components/FlowChart.js";
import "/home/nicolas/projects/aspectjs-next/docs/node_modules/vuepress-plugin-md-enhance/lib/client/styles/footnote.scss";
import "/home/nicolas/projects/aspectjs-next/docs/node_modules/vuepress-plugin-md-enhance/lib/client/styles/image-mark.scss"
import Playground from "/home/nicolas/projects/aspectjs-next/docs/node_modules/vuepress-plugin-md-enhance/lib/client/components/Playground.js";
import Tabs from "/home/nicolas/projects/aspectjs-next/docs/node_modules/vuepress-plugin-md-enhance/lib/client/components/Tabs.js";
import "/home/nicolas/projects/aspectjs-next/docs/node_modules/vuepress-plugin-md-enhance/lib/client/styles/tasklist.scss";
import { defineAsyncComponent } from "vue";
import { injectVuePlaygroundConfig } from "/home/nicolas/projects/aspectjs-next/docs/node_modules/vuepress-plugin-md-enhance/lib/client/index.js";

export default defineClientConfig({
  enhance: ({ app }) => {
    app.component("ChartJS", ChartJS)
    app.component("CodeTabs", CodeTabs);
    if(!hasGlobalComponent("CodeGroup", app)) app.component("CodeGroup", CodeGroup);
    if(!hasGlobalComponent("CodeGroupItem", app)) app.component("CodeGroupItem", CodeGroupItem);
    app.component("CodeDemo", CodeDemo);
    app.component("ECharts", ECharts);
    app.component("FlowChart", FlowChart);
    app.component("Playground", Playground);
    app.component("Tabs", Tabs);
    injectVuePlaygroundConfig(app);
    app.component("VuePlayground", defineAsyncComponent(() => import("/home/nicolas/projects/aspectjs-next/docs/node_modules/vuepress-plugin-md-enhance/lib/client/components/VuePlayground.js")));
  },
});
