//=============================================================================
// SurvivalHUD.js
//=============================================================================

/*:
 * @target MZ
 * @plugindesc Zegar analogowy, pora dnia i pasek wytrzymałości na mapie. Spanie w łóżku odnawia siły. Łupy pokazują się jako unosząca się ikona. v1.1.0
 * @author Claude
 *
 * @param clockImage
 * @text Grafika tarczy zegara
 * @desc Plik z folderu img/system (bez wskazówek - rysuje je plugin).
 * @type file
 * @dir img/system/
 * @default Clock
 *
 * @param clockSize
 * @text Rozmiar zegara na ekranie (px)
 * @desc 0 = rozmiar oryginalnej grafiki (najostrzej). Inna wartość skaluje tarczę.
 * @type number
 * @min 0
 * @default 0
 *
 * @param clockPivotX
 * @text Oś wskazówek X (px na grafice)
 * @type number
 * @default 54
 *
 * @param clockPivotY
 * @text Oś wskazówek Y (px na grafice)
 * @type number
 * @default 54
 *
 * @param minuteHandLength
 * @text Długość wskazówki minutowej (px na grafice)
 * @type number
 * @default 36
 *
 * @param hourHandLength
 * @text Długość wskazówki godzinowej (px na grafice)
 * @type number
 * @default 23
 *
 * @param margin
 * @text Odstęp od rogu ekranu (px)
 * @type number
 * @default 12
 *
 * @param maxStamina
 * @text Maksymalna wytrzymałość
 * @type number
 * @min 1
 * @default 100
 *
 * @param staminaIconIndex
 * @text Numer ikony przy pasku wytrzymałości
 * @desc Numer ikony z IconSet (domyślnie 82: but).
 * @type number
 * @default 82
 *
 * @param wakeHour
 * @text Godzina budzenia po spaniu
 * @type number
 * @min 0
 * @max 23
 * @default 7
 *
 * @param sleepMe
 * @text Melodia podczas spania
 * @type file
 * @dir audio/me/
 * @default Inn1
 *
 * @param popupFrames
 * @text Łupy: czas wyświetlania napisu (klatki)
 * @desc 60 klatek = 1 sekunda.
 * @type number
 * @min 30
 * @default 120
 *
 * @param popupRise
 * @text Łupy: jak wysoko unosi się napis (px)
 * @type number
 * @min 0
 * @default 54
 *
 * @param popupFontSize
 * @text Łupy: wielkość liter
 * @type number
 * @min 12
 * @default 22
 *
 * @command sleep
 * @text Prześpij się (odnów siły)
 * @desc Przewija czas do rana, odnawia wytrzymałość i zdrowie. Użyj między "Zaciemnij ekran" a "Rozjaśnij ekran".
 *
 * @arg wakeHour
 * @text Godzina budzenia
 * @desc Puste = wartość z parametrów wtyczki.
 * @type number
 * @min 0
 * @max 23
 *
 * @arg restoreHealth
 * @text Odnów też zdrowie drużyny
 * @type boolean
 * @default true
 *
 * @command wake
 * @text Komunikat po przebudzeniu
 * @desc Pokazuje numer dnia i porę dnia. Użyj po "Rozjaśnij ekran".
 *
 * @command lootPopup
 * @text Pokaż łup nad graczem
 * @desc Unosząca się ikona z napisem nad graczem (np. "+2 Drewno"), zamiast okna wiadomości.
 *
 * @arg icon
 * @text Numer ikony
 * @type number
 * @min 0
 * @default 0
 *
 * @arg text
 * @text Napis
 * @type string
 * @default +1 Przedmiot
 *
 * @command changeStamina
 * @text Zmień wytrzymałość
 * @desc Dodaje (wartość dodatnia) albo odejmuje (ujemna) wytrzymałość.
 *
 * @arg amount
 * @text Zmiana
 * @type number
 * @min -9999
 * @max 9999
 * @default 20
 *
 * @help
 * ============================================================================
 * SurvivalHUD.js
 * ============================================================================
 * Elementy interfejsu w lewym górnym rogu mapy:
 *   - ZEGAR: prawdziwa tarcza (img/system/Clock.png) z wskazówkami, które
 *     pokazują aktualną godzinę z pluginu DayNightCycle. Pod nim pora dnia i
 *     numer dnia.
 *   - PASEK WYTRZYMAŁOŚCI: prace (ścinanie, kopanie, wydobywanie) go zużywają.
 *     Gdy się wyczerpie, trzeba się wyspać w łóżku.
 * Interfejs nie jest przybliżany razem z mapą (działa razem z pluginem
 * MapZoom) i jest pod oknami dialogowymi.
 *
 * ŁÓŻKO (zdarzenie, wyzwalacz: Przycisk akcji):
 *   1. Pokaż wybór: "Położyć się spać?" - "Spać" / "Jeszcze nie".
 *   2. W gałęzi "Spać": Zaciemnij ekran, Poczekaj 90 klatek, Polecenie
 *      wtyczki "Prześpij się (odnów siły)", Poczekaj 30 klatek, Rozjaśnij
 *      ekran, Polecenie wtyczki "Komunikat po przebudzeniu".
 *
 * ŁUPY: gdy gracz zdobywa przedmiot lub złoto (komenda "Zmień przedmioty",
 * nagrody z drzew i kamieni itd.), nad nim unosi się ikona z napisem, np.
 * "+3 Drewno", zamiast okna wiadomości. Działa automatycznie. Polecenie
 * wtyczki "Pokaż łup nad graczem" pozwala pokazać własny napis.
 *
 * TAGI W NOTATCE MAPY:
 *   <Clock:off>    - ukrywa zegar na tej mapie
 *   <Stamina:off>  - ukrywa pasek wytrzymałości na tej mapie
 *
 * SKRYPTY (komenda "Skrypt", warunki):
 *   $gameSystem.stamina()             - bieżąca wytrzymałość
 *   $gameSystem.maxStamina()          - maksimum
 *   $gameSystem.changeStamina(-10)    - zmiana o wartość
 *   $gameSystem.trySpendStamina(8)    - true i odejmuje, albo false, gdy brak
 *
 * Wytrzymałość i czas są zapisywane razem ze stanem gry.
 * ============================================================================
 */

(() => {
    "use strict";

    const pluginName = "SurvivalHUD";
    const params = PluginManager.parameters(pluginName);
    const num = (value, fallback) =>
        value !== undefined && value !== "" && isFinite(Number(value)) ? Number(value) : fallback;

    const CLOCK_IMAGE = params.clockImage || "Clock";
    const CLOCK_SIZE = num(params.clockSize, 0);
    const PIVOT_X = num(params.clockPivotX, 54);
    const PIVOT_Y = num(params.clockPivotY, 54);
    const MINUTE_LENGTH = num(params.minuteHandLength, 36);
    const HOUR_LENGTH = num(params.hourHandLength, 23);
    const MARGIN = num(params.margin, 12);
    const MAX_STAMINA = num(params.maxStamina, 100);
    const STAMINA_ICON = num(params.staminaIconIndex, 82);
    const WAKE_HOUR = num(params.wakeHour, 7);
    const SLEEP_ME = params.sleepMe || "Inn1";
    const POPUP_FRAMES = num(params.popupFrames, 120);
    const POPUP_RISE = num(params.popupRise, 54);
    const POPUP_FONT = num(params.popupFontSize, 22);
    const GOLD_ICON = 313;

    // ------------------------------------------------------------------
    // Stamina model
    // ------------------------------------------------------------------
    Game_System.prototype.maxStamina = function() {
        return MAX_STAMINA;
    };

    Game_System.prototype.stamina = function() {
        if (this._stamina === undefined) this._stamina = MAX_STAMINA;
        return this._stamina;
    };

    Game_System.prototype.setStamina = function(value) {
        this._stamina = Math.max(0, Math.min(MAX_STAMINA, value));
    };

    Game_System.prototype.changeStamina = function(delta) {
        this.setStamina(this.stamina() + delta);
    };

    Game_System.prototype.staminaRatio = function() {
        return this.stamina() / MAX_STAMINA;
    };

    // Spends the cost if there is enough stamina and reports whether it did.
    Game_System.prototype.trySpendStamina = function(cost) {
        if (!(cost > 0)) return true;
        if (this.stamina() < cost) return false;
        this.changeStamina(-cost);
        return true;
    };

    // ------------------------------------------------------------------
    // Commands: sleeping
    // ------------------------------------------------------------------
    PluginManager.registerCommand(pluginName, "sleep", function(args) {
        const wakeHour = num(args && args.wakeHour, WAKE_HOUR);
        if (typeof $gameSystem.sleepUntilHour === "function") {
            $gameTemp._sleepSummary = $gameSystem.sleepUntilHour(wakeHour);
        } else {
            $gameTemp._sleepSummary = null;
        }
        $gameSystem.setStamina($gameSystem.maxStamina());
        if (!args || args.restoreHealth !== "false") {
            for (const member of $gameParty.members()) member.recoverAll();
        }
        if (SLEEP_ME) {
            AudioManager.playMe({ name: SLEEP_ME, volume: 90, pitch: 100, pan: 0 });
        }
    });

    PluginManager.registerCommand(pluginName, "wake", function() {
        const summary = $gameTemp._sleepSummary;
        if (summary && typeof $gameSystem.dayNightPeriod === "function") {
            $gameMessage.add("Dzień " + summary.day + ". " + $gameSystem.dayNightPeriod().name + ".");
        }
        $gameMessage.add("Czujesz się wypoczęty.");
        this.setWaitMode("message");
    });

    PluginManager.registerCommand(pluginName, "lootPopup", function(args) {
        $gameTemp.pushLootPopup(num(args && args.icon, 0), String((args && args.text) || ""));
    });

    PluginManager.registerCommand(pluginName, "changeStamina", function(args) {
        $gameSystem.changeStamina(num(args && args.amount, 0));
    });

    // ------------------------------------------------------------------
    // HUD
    // ------------------------------------------------------------------
    function makeHandBitmap(poly, color, highlight) {
        let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
        for (const [x, y] of poly) {
            minX = Math.min(minX, x); maxX = Math.max(maxX, x);
            minY = Math.min(minY, y); maxY = Math.max(maxY, y);
        }
        const pad = 2;
        const width = Math.ceil(maxX - minX) + pad * 2;
        const height = Math.ceil(maxY - minY) + pad * 2;
        const ox = -minX + pad, oy = -minY + pad;
        const bitmap = new Bitmap(width, height);
        const ctx = bitmap.context;
        ctx.fillStyle = color;
        ctx.beginPath();
        poly.forEach(([x, y], i) => (i ? ctx.lineTo(x + ox, y + oy) : ctx.moveTo(x + ox, y + oy)));
        ctx.closePath();
        ctx.fill();
        if (highlight) {
            ctx.strokeStyle = highlight;
            ctx.lineWidth = 0.8;
            ctx.beginPath();
            ctx.moveTo(ox, oy - 2);
            ctx.lineTo(ox, minY + oy + 3);
            ctx.stroke();
        }
        bitmap._baseTexture.update();
        bitmap.smooth = true;
        return { bitmap, pivotX: ox, pivotY: oy, width, height };
    }

    function makeCapBitmap() {
        const size = 9;
        const bitmap = new Bitmap(size, size);
        const ctx = bitmap.context;
        ctx.fillStyle = "#46301a";
        ctx.beginPath(); ctx.arc(size / 2, size / 2, 4.3, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = "#d6aa50";
        ctx.beginPath(); ctx.arc(size / 2, size / 2, 2.9, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = "#f4dc9a";
        ctx.beginPath(); ctx.arc(size / 2 - 0.8, size / 2 - 0.8, 1, 0, Math.PI * 2); ctx.fill();
        bitmap._baseTexture.update();
        bitmap.smooth = true;
        return bitmap;
    }

    // The label and the gauge share one frame style: dark wood with a brass rim, like the clock.
    function roundRect(ctx, x, y, w, h, r) {
        ctx.beginPath();
        ctx.moveTo(x + r, y);
        ctx.arcTo(x + w, y, x + w, y + h, r);
        ctx.arcTo(x + w, y + h, x, y + h, r);
        ctx.arcTo(x, y + h, x, y, r);
        ctx.arcTo(x, y, x + w, y, r);
        ctx.closePath();
    }

    function paintPlaque(bmp, x, y, w, h, radius) {
        const ctx = bmp.context;
        ctx.save();
        roundRect(ctx, x + 0.5, y + 0.5, w - 1, h - 1, radius);
        ctx.fillStyle = "#1a100a";
        ctx.fill();
        roundRect(ctx, x + 1.5, y + 1.5, w - 3, h - 3, Math.max(1, radius - 1));
        ctx.fillStyle = "#a67c3a";
        ctx.fill();
        const wood = ctx.createLinearGradient(0, y + 2, 0, y + h - 2);
        wood.addColorStop(0, "#4b3321");
        wood.addColorStop(1, "#26170d");
        roundRect(ctx, x + 2.5, y + 2.5, w - 5, h - 5, Math.max(1, radius - 2));
        ctx.fillStyle = wood;
        ctx.fill();
        ctx.fillStyle = "rgba(255,226,160,0.16)";
        ctx.fillRect(x + 4, y + 3, w - 8, 1);
        ctx.restore();
    }

    function lighten(hex, amount) {
        const n = parseInt(hex.slice(1), 16);
        const c = shift => Math.max(0, Math.min(255, Math.round(((n >> shift) & 255) + amount)));
        return "rgb(" + c(16) + "," + c(8) + "," + c(0) + ")";
    }

    function Sprite_SurvivalHud() {
        this.initialize(...arguments);
    }

    Sprite_SurvivalHud.prototype = Object.create(Sprite.prototype);
    Sprite_SurvivalHud.prototype.constructor = Sprite_SurvivalHud;

    Sprite_SurvivalHud.LABEL_HEIGHT = 24;
    Sprite_SurvivalHud.ICON_SIZE = 32;
    Sprite_SurvivalHud.BAR_WIDTH = 112;
    Sprite_SurvivalHud.BAR_HEIGHT = 20;
    Sprite_SurvivalHud.GAP = 6;

    Sprite_SurvivalHud.prototype.initialize = function() {
        Sprite.prototype.initialize.call(this);
        this.x = MARGIN;
        this.y = MARGIN;
        this._clockScale = 1;
        this._labelKey = "";
        this._staminaKey = "";
        this._pulse = 0;
        this.createClock();
        this.createLabel();
        this.createStaminaGauge();
        this.layout();
        // Registered last: it may fire immediately when the image is already cached.
        this._face.bitmap.addLoadListener(() => this.layout());
    };

    Sprite_SurvivalHud.prototype.clockWidth = function() {
        const bitmap = this._face.bitmap;
        const native = bitmap && bitmap.isReady() ? bitmap.width : 108;
        return CLOCK_SIZE > 0 ? CLOCK_SIZE : native;
    };

    Sprite_SurvivalHud.prototype.createClock = function() {
        this._clock = new Sprite();
        this._face = new Sprite(ImageManager.loadSystem(CLOCK_IMAGE));
        this._clock.addChild(this._face);

        const minute = makeHandBitmap(
            [[-1.7, 9], [1.7, 9], [1.5, -(MINUTE_LENGTH - 7)], [0.6, -MINUTE_LENGTH], [-0.6, -MINUTE_LENGTH], [-1.5, -(MINUTE_LENGTH - 7)]],
            "#1a100a", null);
        const hour = makeHandBitmap(
            [[-2.4, 7], [2.4, 7], [3.2, -3], [1.8, -(HOUR_LENGTH - 6)], [0, -HOUR_LENGTH], [-1.8, -(HOUR_LENGTH - 6)], [-3.2, -3]],
            "#1a100a", "rgba(120,86,50,0.9)");
        this._hourHand = this.makeHandSprite(hour);
        this._minuteHand = this.makeHandSprite(minute);
        this._cap = new Sprite(makeCapBitmap());
        this._cap.anchor.x = 0.5;
        this._cap.anchor.y = 0.5;
        for (const part of [this._hourHand, this._minuteHand, this._cap]) {
            part.x = PIVOT_X;
            part.y = PIVOT_Y;
            this._clock.addChild(part);
        }
        this.addChild(this._clock);
    };

    Sprite_SurvivalHud.prototype.makeHandSprite = function(hand) {
        const sprite = new Sprite(hand.bitmap);
        sprite.anchor.x = hand.pivotX / hand.width;
        sprite.anchor.y = hand.pivotY / hand.height;
        return sprite;
    };

    Sprite_SurvivalHud.prototype.createLabel = function() {
        this._label = new Sprite();
        this.addChild(this._label);
    };

    Sprite_SurvivalHud.prototype.createStaminaGauge = function() {
        this._gauge = new Sprite();
        this._iconBitmap = ImageManager.loadSystem("IconSet");
        this._iconBitmap.addLoadListener(() => { this._staminaKey = ""; });
        this.addChild(this._gauge);
    };

    // Positions the parts once the face image is known (its size can differ).
    Sprite_SurvivalHud.prototype.layout = function() {
        const bitmap = this._face.bitmap;
        const native = bitmap && bitmap.isReady() ? bitmap.width : 108;
        this._clockScale = CLOCK_SIZE > 0 ? CLOCK_SIZE / native : 1;
        this._clock.scale.x = this._clock.scale.y = this._clockScale;
        if (bitmap && bitmap.isReady()) bitmap.smooth = this._clockScale !== 1;
        const width = this.clockWidth();
        const height = (bitmap && bitmap.isReady() ? bitmap.height : 108) * this._clockScale;
        // Everything is left-aligned to the HUD origin (so nothing spills past
        // the screen edge); the clock is centered over the wider gauge.
        const gaugeWidth = Sprite_SurvivalHud.ICON_SIZE + Sprite_SurvivalHud.GAP + Sprite_SurvivalHud.BAR_WIDTH;
        const blockWidth = Math.max(width, gaugeWidth);
        this._clock.x = Math.round((blockWidth - width) / 2);
        this._label.bitmap = new Bitmap(blockWidth, Sprite_SurvivalHud.LABEL_HEIGHT);
        this._label.x = 0;
        this._label.y = Math.round(height) + 2;
        this._labelKey = "";
        this._gauge.bitmap = new Bitmap(gaugeWidth, Sprite_SurvivalHud.ICON_SIZE);
        this._gauge.x = Math.round((blockWidth - gaugeWidth) / 2);
        this._gauge.y = this._label.y + Sprite_SurvivalHud.LABEL_HEIGHT + 6;
        this._staminaKey = "";
    };

    Sprite_SurvivalHud.prototype.update = function() {
        Sprite.prototype.update.call(this);
        const note = ($dataMap && $dataMap.note) || "";
        const showClock = !/<Clock:\s*off\s*>/i.test(note);
        const showStamina = !/<Stamina:\s*off\s*>/i.test(note);
        this._clock.visible = showClock;
        this._label.visible = showClock;
        this._gauge.visible = showStamina;
        if (showClock) this.updateClock();
        if (showStamina) this.updateStamina();
        // With the clock hidden the gauge moves up into its place.
        this._gauge.y = (showClock ? this._label.y + Sprite_SurvivalHud.LABEL_HEIGHT + 6 : 0);
    };

    Sprite_SurvivalHud.prototype.updateClock = function() {
        const hour = typeof $gameSystem.dayNightHour === "function" ? $gameSystem.dayNightHour() : 12;
        this._hourHand.rotation = ((hour % 12) / 12) * Math.PI * 2;
        this._minuteHand.rotation = (hour % 1) * Math.PI * 2;
        if (typeof $gameSystem.dayNightPeriod === "function") {
            const period = $gameSystem.dayNightPeriod();
            const day = $gameSystem.dayNightDay();
            const key = period.id + ":" + day;
            if (key !== this._labelKey) {
                this._labelKey = key;
                this.redrawLabel(period.name + " · dzień " + day);
            }
        }
    };

    Sprite_SurvivalHud.prototype.redrawLabel = function(text) {
        const bmp = this._label.bitmap;
        bmp.clear();
        paintPlaque(bmp, 0, 0, bmp.width, bmp.height, 5);
        bmp.fontSize = 15;
        bmp.textColor = "#f6e7c4";
        bmp.outlineColor = "rgba(20,10,4,0.9)";
        bmp.outlineWidth = 3;
        bmp.drawText(text, 0, 0, bmp.width, bmp.height, "center");
    };

    Sprite_SurvivalHud.prototype.updateStamina = function() {
        const value = Math.ceil($gameSystem.stamina());
        const low = $gameSystem.staminaRatio() <= 0.15;
        if (low) this._pulse = (this._pulse + 1) % 60;
        const pulseOn = low && this._pulse < 30;
        const key = value + ":" + (low ? (pulseOn ? "a" : "b") : "-");
        if (key === this._staminaKey) return;
        this._staminaKey = key;
        this.redrawStamina(value, pulseOn);
    };

    Sprite_SurvivalHud.prototype.redrawStamina = function(value, pulseOn) {
        const bmp = this._gauge.bitmap;
        const ctx = bmp.context;
        const icon = Sprite_SurvivalHud.ICON_SIZE;
        bmp.clear();
        paintPlaque(bmp, 0, 0, icon, icon, 6);
        if (this._iconBitmap.isReady()) {
            const cols = Math.floor(this._iconBitmap.width / icon);
            bmp.blt(this._iconBitmap, (STAMINA_ICON % cols) * icon, Math.floor(STAMINA_ICON / cols) * icon, icon, icon, 0, 0);
        }
        const barX = icon + Sprite_SurvivalHud.GAP;
        const barH = Sprite_SurvivalHud.BAR_HEIGHT;
        const barW = Sprite_SurvivalHud.BAR_WIDTH;
        const barY = Math.round((icon - barH) / 2);
        const ratio = $gameSystem.staminaRatio();
        // frame: dark rim, brass rim, dark trough
        ctx.fillStyle = "#1a100a";
        ctx.fillRect(barX, barY, barW, barH);
        ctx.fillStyle = "#a67c3a";
        ctx.fillRect(barX + 1, barY + 1, barW - 2, barH - 2);
        ctx.fillStyle = "#21150b";
        ctx.fillRect(barX + 2, barY + 2, barW - 4, barH - 4);
        // fill: a lighter top edge over a body that darkens towards the bottom
        const inner = barW - 6, fillH = barH - 6;
        const innerW = Math.max(0, Math.round(inner * ratio));
        let color = ratio > 0.5 ? "#6fcf4f" : ratio > 0.25 ? "#efb432" : "#e04a3a";
        if (pulseOn) color = "#ff8a70";
        if (innerW > 0) {
            const body = ctx.createLinearGradient(0, barY + 3, 0, barY + 3 + fillH);
            body.addColorStop(0, lighten(color, 30));
            body.addColorStop(0.45, color);
            body.addColorStop(1, lighten(color, -55));
            ctx.fillStyle = body;
            ctx.fillRect(barX + 3, barY + 3, innerW, fillH);
            ctx.fillStyle = "rgba(255,255,255,0.32)";
            ctx.fillRect(barX + 3, barY + 3, innerW, 1);
        }
        // ten segments
        ctx.fillStyle = "rgba(20,10,4,0.42)";
        for (let i = 1; i < 10; i++) ctx.fillRect(barX + 3 + Math.round(inner * i / 10), barY + 3, 1, fillH);
        bmp._baseTexture.update();
        bmp.fontSize = 13;
        bmp.fontBold = true;
        bmp.textColor = "#fff8e6";
        bmp.outlineColor = "rgba(20,10,4,0.95)";
        bmp.outlineWidth = 4;
        bmp.drawText(value + " / " + $gameSystem.maxStamina(), barX, barY, barW, barH, "center");
        bmp.fontBold = false;
    };

    // ------------------------------------------------------------------
    // Loot popups: a floating icon + text over the player, instead of a
    // message window, whenever something is gained.
    // ------------------------------------------------------------------
    const POPUP_HEAD = 76;   // px above the player's feet where a popup starts
    const POPUP_ROW = 30;    // vertical spacing between popups shown together
    const easeOutQuad = x => 1 - (1 - x) * (1 - x);

    // Popups only exist on the map (a shop or menu purchase must not queue one).
    Game_Temp.prototype.pushLootPopup = function(iconIndex, text, color) {
        if (!(SceneManager._scene instanceof Scene_Map)) return;
        if (!this._lootPopups) this._lootPopups = [];
        this._lootPopups.push({
            iconIndex, text, color: color || "#ffffff",
            mapX: $gamePlayer._realX, mapY: $gamePlayer._realY
        });
    };

    const _Game_Party_gainItem = Game_Party.prototype.gainItem;
    Game_Party.prototype.gainItem = function(item, amount, includeEquip) {
        const before = item ? this.numItems(item) : 0;
        _Game_Party_gainItem.call(this, item, amount, includeEquip);
        if (item && amount > 0) {
            const gained = this.numItems(item) - before;   // 0 when the stack was already full
            if (gained > 0) {
                const key = item.itypeId === 2;
                $gameTemp.pushLootPopup(item.iconIndex, "+" + gained + " " + item.name, key ? "#ffd866" : "#ffffff");
            }
        }
    };

    const _Game_Party_gainGold = Game_Party.prototype.gainGold;
    Game_Party.prototype.gainGold = function(amount) {
        const before = this.gold();
        _Game_Party_gainGold.call(this, amount);
        const gained = this.gold() - before;
        if (gained > 0) {
            $gameTemp.pushLootPopup(GOLD_ICON, "+" + gained + " " + TextManager.currencyUnit, "#ffe27a");
        }
    };

    function Sprite_LootPopup() {
        this.initialize(...arguments);
    }

    Sprite_LootPopup.prototype = Object.create(Sprite.prototype);
    Sprite_LootPopup.prototype.constructor = Sprite_LootPopup;

    Sprite_LootPopup.prototype.initialize = function(data, slot) {
        Sprite.prototype.initialize.call(this);
        this._data = data;
        this._slot = slot;       // px below the base position, so simultaneous popups do not overlap
        this._age = 0;
        this.anchor.x = 0.5;
        this.anchor.y = 1;
        this.alpha = 0;
        this.createBitmap();
        this.updatePosition();
    };

    Sprite_LootPopup.prototype.createBitmap = function() {
        const icon = Sprite_SurvivalHud.ICON_SIZE;
        const gap = 6, pad = 9, height = 36;
        const probe = new Bitmap(8, 8);
        probe.fontSize = POPUP_FONT;
        const textWidth = Math.ceil(probe.measureTextWidth(this._data.text));
        const width = pad * 2 + icon + gap + textWidth;
        const bmp = new Bitmap(width, height);
        const ctx = bmp.context;
        ctx.fillStyle = "rgba(22,15,10,0.82)";
        ctx.beginPath();
        const r = 10;
        ctx.moveTo(r, 0); ctx.lineTo(width - r, 0); ctx.quadraticCurveTo(width, 0, width, r);
        ctx.lineTo(width, height - r); ctx.quadraticCurveTo(width, height, width - r, height);
        ctx.lineTo(r, height); ctx.quadraticCurveTo(0, height, 0, height - r);
        ctx.lineTo(0, r); ctx.quadraticCurveTo(0, 0, r, 0);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = "rgba(166,124,58,0.85)";   // the brass rim of the windows
        ctx.lineWidth = 1.5;
        ctx.stroke();
        bmp.fontSize = POPUP_FONT;
        bmp.textColor = this._data.color;
        bmp.outlineColor = "rgba(0,0,0,0.9)";
        bmp.outlineWidth = 4;
        bmp.drawText(this._data.text, pad + icon + gap, 0, textWidth + 4, height, "left");
        const iconSheet = ImageManager.loadSystem("IconSet");
        iconSheet.addLoadListener(() => {
            const cols = Math.floor(iconSheet.width / icon);
            const i = this._data.iconIndex;
            bmp.blt(iconSheet, (i % cols) * icon, Math.floor(i / cols) * icon, icon, icon, pad, Math.round((height - icon) / 2));
        });
        bmp._baseTexture.update();
        this.bitmap = bmp;
    };

    // Popups stay where the loot was gained, so they follow the map (and any
    // MapZoom zoom) instead of sticking to the player when he walks away.
    Sprite_LootPopup.prototype.updatePosition = function() {
        const tw = $gameMap.tileWidth(), th = $gameMap.tileHeight();
        let sx = $gameMap.adjustX(this._data.mapX) * tw + tw / 2;
        let sy = $gameMap.adjustY(this._data.mapY) * th + th - POPUP_HEAD;
        const scale = $gameScreen.zoomScale();
        sx = scale * sx - $gameScreen.zoomX() * (scale - 1);
        sy = scale * sy - $gameScreen.zoomY() * (scale - 1);
        const w = this.bitmap ? this.bitmap.width : 0;
        this._offset = this._slot - POPUP_RISE * easeOutQuad(Math.min(1, this._age / POPUP_FRAMES));
        this.x = Math.round(Math.max(w / 2 + 4, Math.min(Graphics.width - w / 2 - 4, sx)));
        this.y = Math.round(Math.max(40, sy + this._offset));
    };

    Sprite_LootPopup.prototype.update = function() {
        Sprite.prototype.update.call(this);
        this._age++;
        const fadeIn = Math.min(1, this._age / 8);
        const fadeOut = Math.min(1, (POPUP_FRAMES - this._age) / 30);
        this.alpha = Math.max(0, Math.min(fadeIn, fadeOut));
        this.scale.x = this.scale.y = 0.75 + 0.25 * fadeIn;
        this.updatePosition();
    };

    Sprite_LootPopup.prototype.isFinished = function() {
        return this._age >= POPUP_FRAMES;
    };

    function Sprite_LootLayer() {
        this.initialize(...arguments);
    }

    Sprite_LootLayer.prototype = Object.create(Sprite.prototype);
    Sprite_LootLayer.prototype.constructor = Sprite_LootLayer;

    // First free row below the base position that no visible popup occupies.
    Sprite_LootLayer.prototype.freeSlot = function() {
        let slot = 0;
        while (this.children.some(p => p._offset !== undefined && Math.abs(p._offset - slot) < POPUP_ROW - 2)) {
            slot += POPUP_ROW;
        }
        return slot;
    };

    Sprite_LootLayer.prototype.update = function() {
        const queue = $gameTemp._lootPopups;
        while (queue && queue.length > 0) {
            this.addChild(new Sprite_LootPopup(queue.shift(), this.freeSlot()));
        }
        Sprite.prototype.update.call(this);
        for (const popup of this.children.slice()) {
            if (popup.isFinished()) this.removeChild(popup);
        }
    };

    // A layer between the map and the windows that is NOT part of the zoomed
    // spriteset, so the HUD keeps its size and place when MapZoom is active.
    const _Scene_Map_createDisplayObjects = Scene_Map.prototype.createDisplayObjects;
    Scene_Map.prototype.createDisplayObjects = function() {
        _Scene_Map_createDisplayObjects.call(this);
        this.createSurvivalHud();
    };

    Scene_Map.prototype.createSurvivalHud = function() {
        this._hudLayer = new Sprite();
        this.addChildAt(this._hudLayer, this.getChildIndex(this._windowLayer));
        this._survivalHud = new Sprite_SurvivalHud();
        this._hudLayer.addChild(this._survivalHud);
        this._lootLayer = new Sprite_LootLayer();
        this._hudLayer.addChild(this._lootLayer);
    };

    Scene_Map.prototype.hudLayer = function() {
        return this._hudLayer || null;
    };
})();
