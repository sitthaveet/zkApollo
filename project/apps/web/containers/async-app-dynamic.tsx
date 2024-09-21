import dynamic from "next/dynamic";

export default dynamic(() => import("./async-app"), {
  ssr: false,
});
