#!/usr/bin/env bun
import { Command } from "commander";
import { makeLoginCommand } from "./commands/login";
import { makeInstallCommand } from "./commands/install";
import { makeUninstallCommand } from "./commands/uninstall";
import { makeListCommand } from "./commands/list";
import { makeConfigCommand } from "./commands/config";
import { makeWhoamiCommand, makeLogoutCommand } from "./commands/whoami";

const program = new Command();

program
  .name("agentcenter")
  .description("AgentCenter CLI — install and manage AI agent extensions")
  .version("0.1.0");

program.addCommand(makeLoginCommand());
program.addCommand(makeLogoutCommand());
program.addCommand(makeWhoamiCommand());
program.addCommand(makeInstallCommand());
program.addCommand(makeUninstallCommand());
program.addCommand(makeListCommand());
program.addCommand(makeConfigCommand());

program.parse();
