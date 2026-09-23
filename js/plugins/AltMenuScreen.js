//=============================================================================
// RPG Maker MZ - Alternative Menu Screen
//=============================================================================

/*:
 * @target MZ
 * @plugindesc Alternative menu screen layout.
 * @author Yoji Ojima
 *
 * @help AltMenuScreen.js
 *
 * This plugin changes the layout of the menu screen.
 * It puts the commands on the top and the status on the bottom.
 *
 * It does not provide plugin commands.
 */

/*:ja
 * @target MZ
 * @plugindesc メニュー画面のレイアウトを変更します。
 * @author Yoji Ojima
 *
 * @help AltMenuScreen.js
 *
 * このプラグインは、メニュー画面のレイアウトを変更します。
 * コマンドを上側に、ステータスを下側に配置します。
 *
 * プラグインコマンドはありません。
 */

(() => {
    Scene_MenuBase.prototype.commandWindowHeight = function() {
        return this.calcWindowHeight(2, true);
    };

    Scene_MenuBase.prototype.goldWindowHeight = function() {
        return this.calcWindowHeight(1, true);
    };

    Scene_Menu.prototype.commandWindowRect = function() {
        const ww = Graphics.boxWidth;
        const wh = this.commandWindowHeight();
        const wx = 0;
        const wy = this.mainAreaTop();
        return new Rectangle(wx, wy, ww, wh);
    };

    Scene_Menu.prototype.statusWindowRect = function() {
        const h1 = this.commandWindowHeight();
        const h2 = this.goldWindowHeight();
        const ww = Graphics.boxWidth;
        const wh = this.mainAreaHeight() - h1 - h2;
        const wx = 0;
        const wy = this.mainAreaTop() + this.commandWindowHeight();
        return new Rectangle(wx, wy, ww, wh);
    };

    Scene_ItemBase.prototype.actorWindowRect = function() {
        const rect = Scene_Menu.prototype.statusWindowRect();
        rect.y = this.mainAreaBottom() - rect.height;
        return rect;
    };

    // maxCols=4 here must keep matching however many top-row commands UITheme.js's HIDE_RPG
    // leaves visible (it hides skill/equip/status/formation, i.e. 4 of the 8 stock commands) -
    // see the numVisibleRows() override in UITheme.js (Window_MenuCommand section) which relies
    // on this same count to lay out a single row instead of two.
    Window_MenuCommand.prototype.maxCols = function() {
        return 4;
    };

    Window_MenuCommand.prototype.numVisibleRows = function() {
        return 2;
    };

    Window_MenuStatus.prototype.maxCols = function() {
        return 4;
    };

    Window_MenuStatus.prototype.numVisibleRows = function() {
        return 1;
    };
})();
