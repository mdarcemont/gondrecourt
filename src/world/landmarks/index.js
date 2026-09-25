/**
 * Registry of hand-detailed landmarks, keyed by the ids in data/landmarks.json.
 * A landmark may restyle its generic building (`style`) and add geometry (`build`);
 * a `standalone` one has no building and is placed at its OSM anchor.
 */
import * as leCentral from './le-central/index.js';
import * as pharmacie from './pharmacie.js';
import * as tour from './tour.js';
import * as mairie from './mairie/index.js';
import * as monument from './monument.js';
import * as eglise from './eglise.js';
import * as tribunal from './tribunal.js';
import * as carpiere from './carpiere/index.js';
import * as carrefour from './carrefour/index.js';
import * as creditAgricole from './credit-agricole.js';
import * as mieMado from './mie-mado.js';
import * as maisonBleue from './maison-bleue.js';
import * as ecole from './ecole.js';
import * as ecoleHall from './ecole-hall.js';
import * as college from './college.js';
import * as pavillon from './pavillon.js';
import * as lavoir from './lavoir.js';

export const LANDMARKS = { 'le-central': leCentral, pharmacie, tour, mairie, monument, eglise, tribunal, carpiere, carrefour, 'credit-agricole': creditAgricole, 'mie-mado': mieMado, 'maison-bleue': maisonBleue, ecole, 'ecole-hall': ecoleHall, college, pavillon, lavoir };
