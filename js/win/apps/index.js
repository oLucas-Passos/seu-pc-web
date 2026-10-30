// Registra todos os aplicativos do Windows simulado.
import { APPS } from './registry.js';
import explorer from './explorer.js';
import notepad from './notepad.js';
import calculator from './calculator.js';
import paint from './paint.js';
import { photos, player } from './media.js';
import browser from './browser.js';
import settings from './settings.js';
import { taskmgr, storeApp } from './system.js';
import { minesweeper, tictactoe, snake } from './games.js';

for (const app of [explorer, notepad, calculator, paint, photos, player, browser, settings, taskmgr, storeApp, minesweeper, tictactoe, snake]) {
  APPS[app.id] = app;
}

export { APPS };
