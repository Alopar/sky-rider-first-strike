# Архитектура

Документ описывает техническую структуру проекта: сцены, системы, потоки данных, расположение файлов. Идея — чтобы по этой странице можно было собрать каркас, не возвращаясь к остальной документации.

## Высокоуровневая картина

```
                        ┌────────────────────────┐
                        │      Phaser.Game       │
                        └───────────┬────────────┘
                                    │
   ┌────────────┬───────────┬───────┴────────┬──────────────┬────────────┐
   │            │           │                │              │            │
 Boot       Preload     MainMenu       LevelSelect       Game ◄────► HUD
                                                           │
                                                       (parallel)
                                                           │
                                                       Pause / GameOver / Victory
```

- Все системы (оружие, спавнер, параллакс, ввод, счёт и т. д.) **не являются сценами**. Это обычные классы из `src/systems/`, которые создаются в `GameScene.create()` и живут до конца уровня.
- Связь между системами и сценами — через **шину событий** (`EventBus`, инстанс `Phaser.Events.EventEmitter`, прокинутый через `registry` или через простой синглтон-модуль). Это позволяет HUD-сцене реагировать на события без прямой ссылки на GameScene.
- Конфигурация (палитра, оружие, враги, уровни) — это **данные** из `src/config/`. Системы читают данные, а не хардкодят.

## Сцены

### `BootScene`

- Минимум: ставит фон, готовит общий `registry` (палитра, настройки), запускает `PreloadScene`.

### `PreloadScene`

- Прогон через `SvgTextureFactory`: пред-генерация всех нужных текстур (игрок, пули, 4 типа врагов в состояниях idle/hit, босс, бонусы, UI-кнопки, окна, HUD-бары).
- Загрузка прогресса из `localStorage` через `ProgressionStore`.
- По завершении → `MainMenuScene`.

### `MainMenuScene`

- Заголовок, кнопки.
- Перенаправляет на `LevelSelectScene` или сразу на `GameScene` с первым уровнем (опция «Быстрый старт»).

### `LevelSelectScene`

- Сетка карточек уровней (открытые/закрытые/пройденные, лучший счёт).
- Старт уровня → `this.scene.start('GameScene', { levelId })`.

### `GameScene`

Ядро игры. В `create()` создаёт и связывает:

- `InputManager`
- `ParallaxStarfield` (рисует слои звёзд)
- `LayerManager` (логические depth-диапазоны и группы)
- `Player`, `WeaponSystem`
- `EnemyFactory`, `SpawnDirector` (читает конфиг уровня)
- `CollisionMatrix` (настраивает overlap-ы и colliders между группами)
- `ScoreSystem`
- запускает параллельно `HUDScene`

В `update()` — обновляет все системы и сущности в правильном порядке (вход → игрок → оружие → пули → враги → коллизии → эффекты).

При смерти игрока / прохождении уровня — посылает событие, останавливает себя, поднимает `GameOverScene` или `VictoryScene`.

### `HUDScene`

- Запускается параллельно с `GameScene` через `scene.launch`.
- Слушает `EventBus`, обновляет HP, счёт, уровень оружия, HP-бар босса.

### `PauseScene`

- Запускается оверлеем при `Esc` / `P`, `pauses` `GameScene`.

### `GameOverScene` / `VictoryScene`

- Модальные сцены поверх `GameScene` (или после её остановки).
- Показывают итог, кнопки «Повторить» / «В меню» / (для победы) «Следующий уровень».

## Логические слои отображения и коллизий

`LayerManager` фиксирует depth-диапазоны:

| Depth | Слой |
|-------|------|
| 0–99 | Параллакс-звёзды (3 слоя) |
| 100–199 | Враги нижнего слоя и их частицы |
| 200–299 | Пули игрока (видны и над фоном, и под игроком — на выбор) |
| 300–399 | Враги верхнего слоя, вражеские пули |
| 400–449 | Игрок |
| 450–499 | Эффекты поверх игрока (взрывы) |
| 1000+ | HUD (но HUD живёт в отдельной сцене, поэтому depth там свой) |

Группы для физики (через arcade physics или просто overlap-проверки):

- `playerBullets`
- `bgEnemies` (нижний слой)
- `fgEnemies` (верхний слой)
- `enemyBullets`
- `powerUps`
- `player` (одиночка)

Матрица коллизий:

| | playerBullets | enemyBullets | bgEnemies | fgEnemies | powerUps |
|---|---|---|---|---|---|
| **player** | — | overlap (урон) | — | overlap (урон) | overlap (подбор) |
| **playerBullets** | — | — | overlap (урон) | overlap (урон) | — |

Тот факт, что игрок **не сталкивается** с `bgEnemies`, — это явное правило матрицы, а не «забыли настроить».

## Системы

### `SvgTextureFactory`

- API: `getOrCreate(key, templateFn, params) -> Promise<textureKey>` и синхронный вариант для предзагруженных.
- Внутренний кэш по `key`.
- Используется и в `PreloadScene` (массовая предзагрузка), и в `UISvgKit`.

### `InputManager`

- Абстрагирует физические клавиши: `isLeft()`, `isRight()`, `isUp()`, `isDown()`, `isFiring()`, `isPausePressed()`, `isBombPressed()`.
- Поддерживает стрелки и WASD одновременно.
- Готов к расширению (геймпад, тач).

### `ParallaxStarfield`

- 3 слоя. Параметры (плотность, скорости, цвета) — из конфига уровня (с дефолтом).
- API: `update(dt)`, `setSpeedMultiplier(m)` для эффекта «варпа».

### `WeaponSystem`

- Состояние: `level`, кулдаун.
- API: `setLevel(n)`, `tryFire(player, time)`.
- Паттерны на каждый уровень — из `config/weapons.js`: количество, углы, скорость, кулдаун.
- Спавнит `PlayerBullet` через пул (object pool) для производительности.

### `EnemyFactory`

- API: `spawn(type, params, layer)`.
- Знает, как собрать сущность по её типу: визуальный ассет + поведение + параметры.
- Регистрирует созданную сущность в нужной группе через `LayerManager`.

### `SpawnDirector`

- Принимает конфиг уровня (массив волн с таймингами).
- В `update(time)` решает, какие волны пора заспавнить, дергает `EnemyFactory`.
- Знает про маркер «появляется босс» и события `level:boss-spawned`, `level:cleared`.

### Поведения врагов (`src/behaviors/`)

- Чистые функции/классы с `update(entity, dt, context)`.
- Примеры: `StraightDown`, `SineWeave`, `DiveAttack`, `BossPhase1`, `BossPhase2`.
- Можно навешивать комбинации: одно поведение управляет движением, второе — стрельбой.

### `ScoreSystem`

- `addScore(amount, sourceType)`, `registerHit()`, `registerMiss()`.
- Хранит множитель, эмитит `score:changed`.

### `ProgressionStore`

- Чтение/запись в `localStorage`. Ключ верхнего уровня — `sky-rider-first-strike:v1`.
- Структура: `{ unlockedLevels: number[], bestScores: { [levelId]: number }, settings: {...} }`.
- Версия (`v1`) в ключе — чтобы можно было мигрировать.

### `EventBus`

- Простой `Phaser.Events.EventEmitter`, выставленный в `game.registry` или импортируемый как модуль-синглтон.
- Канонический список событий зафиксирован в `src/systems/events.js` как константы (`EVT.PLAYER_HIT`, `EVT.SCORE_CHANGED`, `EVT.BOSS_SPAWNED`, и т. д.). Нет «магических строк» по коду.

## Сущности

```
src/entities/
  Player.js
  PlayerBullet.js
  EnemyBullet.js
  enemies/
    DrifterEnemy.js
    HaulerEnemy.js
    StrikerEnemy.js
    WeaverEnemy.js
    BossEnemy.js
  powerups/
    WeaponPowerUp.js
    ShieldPowerUp.js
```

Принципы:

- Сущность ничего не знает про конкретный уровень, счёт или прогрессию. Она знает только своё HP, своё положение и какие события эмитить при смерти/попадании.
- Все сущности используют пулы (object pool), где это имеет смысл (пули — точно).
- Внешний вид сущности — это её ключ текстуры (или несколько ключей для состояний).

## Полная структура папок

```
sky-rider-first-strike/
├── index.html
├── README.md
├── scripts/
│   └── serve.py
├── assets/                  // на будущее, если появятся внешние ассеты
├── docs/                    // эта документация
└── src/
    ├── main.js              // создаёт Phaser.Game и регистрирует сцены
    ├── config/
    │   ├── game-config.js   // размеры, физика, фичи-флаги
    │   ├── palette.js
    │   ├── weapons.js
    │   ├── enemies.js
    │   └── levels/
    │       ├── level-01.js
    │       └── level-02.js
    ├── scenes/
    │   ├── BootScene.js
    │   ├── PreloadScene.js
    │   ├── MainMenuScene.js
    │   ├── LevelSelectScene.js
    │   ├── GameScene.js
    │   ├── HUDScene.js
    │   ├── PauseScene.js
    │   ├── GameOverScene.js
    │   └── VictoryScene.js
    ├── systems/
    │   ├── SvgTextureFactory.js
    │   ├── InputManager.js
    │   ├── ParallaxStarfield.js
    │   ├── WeaponSystem.js
    │   ├── EnemyFactory.js
    │   ├── SpawnDirector.js
    │   ├── LayerManager.js
    │   ├── CollisionMatrix.js
    │   ├── ScoreSystem.js
    │   ├── ProgressionStore.js
    │   ├── EventBus.js
    │   └── events.js
    ├── behaviors/
    │   ├── StraightDown.js
    │   ├── SineWeave.js
    │   ├── DiveAttack.js
    │   ├── BossPhase1.js
    │   └── BossPhase2.js
    ├── entities/
    │   ├── Player.js
    │   ├── PlayerBullet.js
    │   ├── EnemyBullet.js
    │   ├── enemies/
    │   └── powerups/
    └── ui/
        ├── UISvgKit.js
        ├── svg-templates/
        └── components/
```

## Поток данных в одном кадре (упрощённо)

1. `InputManager` снимает состояние ввода.
2. `Player.update()` читает ввод, обновляет позицию, дергает `WeaponSystem.tryFire(...)`.
3. `WeaponSystem` спавнит пули через пул.
4. `SpawnDirector.update(time)` решает, не пора ли заспавнить новую волну.
5. Каждая сущность врага обновляет своё поведение (движение/стрельба).
6. `CollisionMatrix` обрабатывает overlap-ы: попадания → `EVT.ENEMY_HIT`, `EVT.PLAYER_HIT`, `EVT.POWERUP_PICKED`.
7. Подписчики событий: `ScoreSystem` копит очки, `HUDScene` обновляет UI, `Player` теряет HP, `WeaponSystem` повышает уровень при подборе.
8. `ParallaxStarfield.update(dt)` двигает звёзды.
9. Phaser рисует кадр.

## Сохранения и состояние

`localStorage` ключ: `sky-rider-first-strike:v1`.

```
{
  "unlockedLevels": [1],
  "bestScores": { "1": 0 },
  "settings": {
    "musicVolume": 0.7,
    "sfxVolume": 1.0
  }
}
```

`ProgressionStore` — единственное место, которое читает/пишет в `localStorage`.

## Что закладываем «на вырост»

- **Геймпад/тач-ввод** — изоляция в `InputManager` уже это позволяет.
- **Звук** — добавление `AudioBus` не затронет ни одну систему, кроме подписчиков на события.
- **Больше уровней и врагов** — только данные в `src/config/`.
- **Темизация UI** — смена `palette.js` и инвалидация SVG-кэша.
- **Несколько типов оружия (а не только уровни)** — `WeaponSystem` уже параметризован паттерном; вместо `level` можно сделать `pattern`.
- **Реплеи/телеметрия** — события уже централизованы.

## Что НЕ закладываем

- DI-контейнер — для размера проекта избыточно.
- TypeScript — позже, при росте кодовой базы; на текущем этапе чистый JS с JSDoc-типами при необходимости.
- Сторонние UI-фреймворки — UI делаем на собственном SVG-ките, это часть гипотезы проекта.
