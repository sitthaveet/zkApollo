import dynamic from "next/dynamic";

export default dynamic(() => import("./async-swap"), {
  ssr: false,
});
