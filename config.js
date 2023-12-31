#!/usr/bin/env node

import Conf from "conf";
import chalk from "chalk";
import process from "node:process";
import fs from "node:fs/promises";
import { spawnSync, spawn } from "node:child_process";
import path from "node:path";

const entryConfigName = "bookmarkEntry";
const bookMarkListName = "bookmarks";

const { log } = console;
const entryConfig = new Conf({ projectName: entryConfigName });

const configManager = (function Config() {
  var publicAPI = {
    addBookMark,
    removeBookMarks,
    displayBookMarkList,
    jumpToPath,
  };

  return publicAPI;

  // ***
  // Publics
  // ***

  function addBookMark(name, providedPath) {
    var pathName = process.cwd();
    let existingBookMark = getBookMark(name);
    if (existingBookMark) {
      log(
        chalk.redBright(
          `${getBookMarkName(
            existingBookMark
          )} already exists at ${getBookMarkPath(existingBookMark)}`
        )
      );
      process.exit();
    }

    if (path.isAbsolute(providedPath)) {
      pathName = providedPath;
    } else {
      pathName = path.join(pathName, providedPath);
    }

    fs.lstat(pathName)
      .then((stats) => {
        if (stats.isDirectory()) {
          addBookMarkToPath(name, pathName);
          log(chalk.greenBright(`${name} was created at ${pathName}`));
        } else {
          log(chalk.redBright(`${pathName} is not a directory`));
        }
      })
      .catch(() => {
        log(chalk.redBright(`${pathName} is not a valid path`));
      });
  }

  function removeBookMarks(...names) {
    var bookMarkList = getBookMarks();
    bookMarkList = bookMarkList.filter(function removeSpecifiedBookMarksCB(
      bookMark
    ) {
      return !names.includes(getBookMarkName(bookMark));
    });

    updateBookMarkList(bookMarkList);
    log(chalk.greenBright("Bookmarks were removed"));
  }

  function displayBookMarkList() {
    const bookMarkList = getBookMarks();
    if (bookMarkList.length === 0) {
      log(chalk.blueBright("You don't have any bookmarks yet"));
      process.exit();
    }

    for (let [index, bookMark] of bookMarkList.entries()) {
      log(
        chalk.greenBright(
          `${index + 1}. ${getBookMarkName(bookMark)} - ${getBookMarkPath(
            bookMark
          )}`
        )
      );
    }
  }

  function jumpToPath(name) {
    var bookMark = getBookMark(name);
    if (!bookMark) {
      log(chalk.redBright(`${name} does not exist`));
      process.exit();
    }

    startShellProcess(getBookMarkPath(bookMark));
  }

  // ***
  // Privates
  // ***

  // DATA STRUCTURE

  function createBookMark(name, path) {
    return { name, path };
  }

  function getBookMarkName(bookMark) {
    return bookMark.name;
  }

  function getBookMarkPath(bookMark) {
    return bookMark.path;
  }

  // FIN (DATA STRUCTURE)

  // GETTERS

  function getBookMarks() {
    return entryConfig.get(bookMarkListName) || [];
  }

  function getBookMark(name) {
    const bookMarkList = getBookMarks();
    return bookMarkList.find(function findBookMarkCB(bookMark) {
      return name === getBookMarkName(bookMark);
    });
  }

  // FIN (GETTERS)

  // SETTERS

  function updateBookMarkList(list) {
    entryConfig.set(bookMarkListName, list);
  }

  // FIN (SETTERS)

  // HELPERS

  function addBookMarkToPath(name, path) {
    var bookMarkList = getBookMarks();
    var newBookMark = createBookMark(name, path);

    bookMarkList.push(newBookMark);
    updateBookMarkList(bookMarkList);
    return newBookMark;
  }

  function startShellProcess(targetLocation) {
    if (process.platform === "win32") {
      let cd = spawn(
        "start",
        [
          "powershell.exe",
          "-NoExit",
          "-Command",
          `Set-Location '${targetLocation}'`,
        ],
        { detached: true, shell: true }
      );

      cd.on("error", (error) => {
        console.log(`Error occured ${error}`);
        cd.kill();
      });

      // detach the child process from the parent and exit the program
      cd.unref();
      process.exit();
    } else if (process.platform === "linux") {
      log(targetLocation);
      let cd = spawn(
        "gnome-terminal",
        ["--", `bash -c "cd '${targetLocation}'; exec bash"`],
        { detached: true, shell: true }
      );

      cd.on("error", (error) => {
        console.log(`Error occured ${error}`);
        cd.kill();
      });

      // detach the child process from the parent and exit the program
      cd.unref();
      process.exit();
    }
  }

  // FIN (HELPERS)
})();

export default configManager;
