import { Balance, VanillaRuntimeModules } from "@proto-kit/library";
import { ModulesConfig } from "@proto-kit/common";
import { CustodyModule } from "./custody";



export const modules = VanillaRuntimeModules.with({
  CustodyModule,
});

export const config: ModulesConfig<typeof modules> = {
  Balances: {
    totalSupply: Balance.from(10_000),
  },
  CustodyModule: {
  },
};

export default {
  modules,
  config,
};
