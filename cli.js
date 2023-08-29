import { program } from "commander";
import configManager from "./config.js";

program.name("bookmark | bm");

program
  .command("add <name> [path]")
  .description(
    "Create a bookmark at a path. If path is not provided, a bookmark will be created in the current directory"
  )
  .action(configManager.addBookMark);

program
  .command("view")
  .description("Show all bookmarks")
  .action(configManager.displayBookMarkList);

program
  .command("remove <name>")
  .description("Remove a bookmark")
  .action(configManager.removeBookMarks);

program
  .command("jump <name>")
  .description("Jump to a bookmark")
  .action(configManager.jumpToPath);

program.parse();
