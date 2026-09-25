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

export const LANDMARKS = { 'le-central': leCentral, pharmacie, tour, mairie, monument, eglise };
