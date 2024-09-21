import dynamic from "next/dynamic";

export default dynamic(() => import("./async-faucet"), {
  ssr: false,
});
