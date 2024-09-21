import { Balance, VanillaRuntimeModules } from "@proto-kit/library";
import { ModulesConfig } from "@proto-kit/common";
import { CustodyModule } from "./modules/custody";

export const modules = VanillaRuntimeModules.with({
  CustodyModule,
});

export const config: ModulesConfig<typeof modules> = {
  CustodyModule: {
    totalSupply: Balance.from(100_000_000),
  },
  Balances: {
    totalSupply: Balance.from(100_000_000),
  },
};

export default {
  modules,
  config,
};
