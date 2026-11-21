const __pluginConfig =  {
  "name": "windy-plugin-itrip",
  "version": "0.1.0",
  "icon": "⛵",
  "title": "iTrip sobre viento",
  "description": "Muestra el track, la posición y el rumbo (BNO055) del iTrip sobre la capa de viento de Windy, con viento real y ángulo al viento en la posición del barco.",
  "author": "blascubilla",
  "repository": "https://github.com/blascubilla/caja_arduino_bno055",
  "desktopUI": "rhpane",
  "mobileUI": "small",
  "desktopWidth": 260,
  "routerPath": "/itrip",
  "private": true,
  "built": 1795234930451,
  "builtReadable": "2026-11-21T04:22:10.451Z"
};

// transformCode: import bcast from '@windy/broadcast';
const bcast = W.broadcast;

// transformCode: import { map } from '@windy/map';
const { map } = W.map;

// transformCode: import { isMobileOrTablet } from '@windy/rootScope';
const { isMobileOrTablet } = W.rootScope;

// transformCode: import { getLatLonInterpolator } from '@windy/interpolator';
const { getLatLonInterpolator } = W.interpolator;

// transformCode: import store from '@windy/store';
const store = W.store;

// transformCode: import { wind2obj } from '@windy/utils';
const { wind2obj } = W.utils;

// transformCode: import metrics from '@windy/metrics';
const metrics = W.metrics;


/** @returns {void} */
function noop() {}

function run(fn) {
	return fn();
}

function blank_object() {
	return Object.create(null);
}

/**
 * @param {Function[]} fns
 * @returns {void}
 */
function run_all(fns) {
	fns.forEach(run);
}

/**
 * @param {any} thing
 * @returns {thing is Function}
 */
function is_function(thing) {
	return typeof thing === 'function';
}

/** @returns {boolean} */
function safe_not_equal(a, b) {
	return a != a ? b == b : a !== b || (a && typeof a === 'object') || typeof a === 'function';
}

/** @returns {boolean} */
function is_empty(obj) {
	return Object.keys(obj).length === 0;
}

/**
 * @param {Node} target
 * @param {Node} node
 * @returns {void}
 */
function append(target, node) {
	target.appendChild(node);
}

/**
 * @param {Node} target
 * @param {string} style_sheet_id
 * @param {string} styles
 * @returns {void}
 */
function append_styles(target, style_sheet_id, styles) {
	const append_styles_to = get_root_for_style(target);
	if (!append_styles_to.getElementById(style_sheet_id)) {
		const style = element('style');
		style.id = style_sheet_id;
		style.textContent = styles;
		append_stylesheet(append_styles_to, style);
	}
}

/**
 * @param {Node} node
 * @returns {ShadowRoot | Document}
 */
function get_root_for_style(node) {
	if (!node) return document;
	const root = node.getRootNode ? node.getRootNode() : node.ownerDocument;
	if (root && /** @type {ShadowRoot} */ (root).host) {
		return /** @type {ShadowRoot} */ (root);
	}
	return node.ownerDocument;
}

/**
 * @param {ShadowRoot | Document} node
 * @param {HTMLStyleElement} style
 * @returns {CSSStyleSheet}
 */
function append_stylesheet(node, style) {
	append(/** @type {Document} */ (node).head || node, style);
	return style.sheet;
}

/**
 * @param {Node} target
 * @param {Node} node
 * @param {Node} [anchor]
 * @returns {void}
 */
function insert(target, node, anchor) {
	target.insertBefore(node, anchor || null);
}

/**
 * @param {Node} node
 * @returns {void}
 */
function detach(node) {
	if (node.parentNode) {
		node.parentNode.removeChild(node);
	}
}

/**
 * @returns {void} */
function destroy_each(iterations, detaching) {
	for (let i = 0; i < iterations.length; i += 1) {
		if (iterations[i]) iterations[i].d(detaching);
	}
}

/**
 * @template {keyof HTMLElementTagNameMap} K
 * @param {K} name
 * @returns {HTMLElementTagNameMap[K]}
 */
function element(name) {
	return document.createElement(name);
}

/**
 * @param {string} data
 * @returns {Text}
 */
function text(data) {
	return document.createTextNode(data);
}

/**
 * @returns {Text} */
function space() {
	return text(' ');
}

/**
 * @returns {Text} */
function empty() {
	return text('');
}

/**
 * @param {EventTarget} node
 * @param {string} event
 * @param {EventListenerOrEventListenerObject} handler
 * @param {boolean | AddEventListenerOptions | EventListenerOptions} [options]
 * @returns {() => void}
 */
function listen(node, event, handler, options) {
	node.addEventListener(event, handler, options);
	return () => node.removeEventListener(event, handler, options);
}

/**
 * @param {Element} node
 * @param {string} attribute
 * @param {string} [value]
 * @returns {void}
 */
function attr(node, attribute, value) {
	if (value == null) node.removeAttribute(attribute);
	else if (node.getAttribute(attribute) !== value) node.setAttribute(attribute, value);
}

/** @returns {number} */
function to_number(value) {
	return value === '' ? null : +value;
}

/**
 * @param {Element} element
 * @returns {ChildNode[]}
 */
function children(element) {
	return Array.from(element.childNodes);
}

/**
 * @param {Text} text
 * @param {unknown} data
 * @returns {void}
 */
function set_data(text, data) {
	data = '' + data;
	if (text.data === data) return;
	text.data = /** @type {string} */ (data);
}

/**
 * @returns {void} */
function set_input_value(input, value) {
	input.value = value == null ? '' : value;
}

/**
 * @returns {void} */
function select_option(select, value, mounting) {
	for (let i = 0; i < select.options.length; i += 1) {
		const option = select.options[i];
		if (option.__value === value) {
			option.selected = true;
			return;
		}
	}
	if (!mounting || value !== undefined) {
		select.selectedIndex = -1; // no option should be selected
	}
}

function select_value(select) {
	const selected_option = select.querySelector(':checked');
	return selected_option && selected_option.__value;
}

/**
 * @returns {void} */
function toggle_class(element, name, toggle) {
	// The `!!` is required because an `undefined` flag means flipping the current state.
	element.classList.toggle(name, !!toggle);
}

/**
 * @typedef {Node & {
 * 	claim_order?: number;
 * 	hydrate_init?: true;
 * 	actual_end_child?: NodeEx;
 * 	childNodes: NodeListOf<NodeEx>;
 * }} NodeEx
 */

/** @typedef {ChildNode & NodeEx} ChildNodeEx */

/** @typedef {NodeEx & { claim_order: number }} NodeEx2 */

/**
 * @typedef {ChildNodeEx[] & {
 * 	claim_info?: {
 * 		last_index: number;
 * 		total_claimed: number;
 * 	};
 * }} ChildNodeArray
 */

let current_component;

/** @returns {void} */
function set_current_component(component) {
	current_component = component;
}

function get_current_component() {
	if (!current_component) throw new Error('Function called outside component initialization');
	return current_component;
}

/**
 * The `onMount` function schedules a callback to run as soon as the component has been mounted to the DOM.
 * It must be called during the component's initialisation (but doesn't need to live *inside* the component;
 * it can be called from an external module).
 *
 * If a function is returned _synchronously_ from `onMount`, it will be called when the component is unmounted.
 *
 * `onMount` does not run inside a [server-side component](https://svelte.dev/docs#run-time-server-side-component-api).
 *
 * https://svelte.dev/docs/svelte#onmount
 * @template T
 * @param {() => import('./private.js').NotFunction<T> | Promise<import('./private.js').NotFunction<T>> | (() => any)} fn
 * @returns {void}
 */
function onMount(fn) {
	get_current_component().$$.on_mount.push(fn);
}

/**
 * Schedules a callback to run immediately before the component is unmounted.
 *
 * Out of `onMount`, `beforeUpdate`, `afterUpdate` and `onDestroy`, this is the
 * only one that runs inside a server-side component.
 *
 * https://svelte.dev/docs/svelte#ondestroy
 * @param {() => any} fn
 * @returns {void}
 */
function onDestroy(fn) {
	get_current_component().$$.on_destroy.push(fn);
}

const dirty_components = [];
const binding_callbacks = [];

let render_callbacks = [];

const flush_callbacks = [];

const resolved_promise = /* @__PURE__ */ Promise.resolve();

let update_scheduled = false;

/** @returns {void} */
function schedule_update() {
	if (!update_scheduled) {
		update_scheduled = true;
		resolved_promise.then(flush);
	}
}

/** @returns {void} */
function add_render_callback(fn) {
	render_callbacks.push(fn);
}

// flush() calls callbacks in this order:
// 1. All beforeUpdate callbacks, in order: parents before children
// 2. All bind:this callbacks, in reverse order: children before parents.
// 3. All afterUpdate callbacks, in order: parents before children. EXCEPT
//    for afterUpdates called during the initial onMount, which are called in
//    reverse order: children before parents.
// Since callbacks might update component values, which could trigger another
// call to flush(), the following steps guard against this:
// 1. During beforeUpdate, any updated components will be added to the
//    dirty_components array and will cause a reentrant call to flush(). Because
//    the flush index is kept outside the function, the reentrant call will pick
//    up where the earlier call left off and go through all dirty components. The
//    current_component value is saved and restored so that the reentrant call will
//    not interfere with the "parent" flush() call.
// 2. bind:this callbacks cannot trigger new flush() calls.
// 3. During afterUpdate, any updated components will NOT have their afterUpdate
//    callback called a second time; the seen_callbacks set, outside the flush()
//    function, guarantees this behavior.
const seen_callbacks = new Set();

let flushidx = 0; // Do *not* move this inside the flush() function

/** @returns {void} */
function flush() {
	// Do not reenter flush while dirty components are updated, as this can
	// result in an infinite loop. Instead, let the inner flush handle it.
	// Reentrancy is ok afterwards for bindings etc.
	if (flushidx !== 0) {
		return;
	}
	const saved_component = current_component;
	do {
		// first, call beforeUpdate functions
		// and update components
		try {
			while (flushidx < dirty_components.length) {
				const component = dirty_components[flushidx];
				flushidx++;
				set_current_component(component);
				update(component.$$);
			}
		} catch (e) {
			// reset dirty state to not end up in a deadlocked state and then rethrow
			dirty_components.length = 0;
			flushidx = 0;
			throw e;
		}
		set_current_component(null);
		dirty_components.length = 0;
		flushidx = 0;
		while (binding_callbacks.length) binding_callbacks.pop()();
		// then, once components are updated, call
		// afterUpdate functions. This may cause
		// subsequent updates...
		for (let i = 0; i < render_callbacks.length; i += 1) {
			const callback = render_callbacks[i];
			if (!seen_callbacks.has(callback)) {
				// ...so guard against infinite loops
				seen_callbacks.add(callback);
				callback();
			}
		}
		render_callbacks.length = 0;
	} while (dirty_components.length);
	while (flush_callbacks.length) {
		flush_callbacks.pop()();
	}
	update_scheduled = false;
	seen_callbacks.clear();
	set_current_component(saved_component);
}

/** @returns {void} */
function update($$) {
	if ($$.fragment !== null) {
		$$.update();
		run_all($$.before_update);
		const dirty = $$.dirty;
		$$.dirty = [-1];
		$$.fragment && $$.fragment.p($$.ctx, dirty);
		$$.after_update.forEach(add_render_callback);
	}
}

/**
 * Useful for example to execute remaining `afterUpdate` callbacks before executing `destroy`.
 * @param {Function[]} fns
 * @returns {void}
 */
function flush_render_callbacks(fns) {
	const filtered = [];
	const targets = [];
	render_callbacks.forEach((c) => (fns.indexOf(c) === -1 ? filtered.push(c) : targets.push(c)));
	targets.forEach((c) => c());
	render_callbacks = filtered;
}

const outroing = new Set();

/**
 * @param {import('./private.js').Fragment} block
 * @param {0 | 1} [local]
 * @returns {void}
 */
function transition_in(block, local) {
	if (block && block.i) {
		outroing.delete(block);
		block.i(local);
	}
}

/** @typedef {1} INTRO */
/** @typedef {0} OUTRO */
/** @typedef {{ direction: 'in' | 'out' | 'both' }} TransitionOptions */
/** @typedef {(node: Element, params: any, options: TransitionOptions) => import('../transition/public.js').TransitionConfig} TransitionFn */

/**
 * @typedef {Object} Outro
 * @property {number} r
 * @property {Function[]} c
 * @property {Object} p
 */

/**
 * @typedef {Object} PendingProgram
 * @property {number} start
 * @property {INTRO|OUTRO} b
 * @property {Outro} [group]
 */

/**
 * @typedef {Object} Program
 * @property {number} a
 * @property {INTRO|OUTRO} b
 * @property {1|-1} d
 * @property {number} duration
 * @property {number} start
 * @property {number} end
 * @property {Outro} [group]
 */

// general each functions:

function ensure_array_like(array_like_or_iterator) {
	return array_like_or_iterator?.length !== undefined
		? array_like_or_iterator
		: Array.from(array_like_or_iterator);
}

/** @returns {void} */
function mount_component(component, target, anchor) {
	const { fragment, after_update } = component.$$;
	fragment && fragment.m(target, anchor);
	// onMount happens before the initial afterUpdate
	add_render_callback(() => {
		const new_on_destroy = component.$$.on_mount.map(run).filter(is_function);
		// if the component was destroyed immediately
		// it will update the `$$.on_destroy` reference to `null`.
		// the destructured on_destroy may still reference to the old array
		if (component.$$.on_destroy) {
			component.$$.on_destroy.push(...new_on_destroy);
		} else {
			// Edge case - component was destroyed immediately,
			// most likely as a result of a binding initialising
			run_all(new_on_destroy);
		}
		component.$$.on_mount = [];
	});
	after_update.forEach(add_render_callback);
}

/** @returns {void} */
function destroy_component(component, detaching) {
	const $$ = component.$$;
	if ($$.fragment !== null) {
		flush_render_callbacks($$.after_update);
		run_all($$.on_destroy);
		$$.fragment && $$.fragment.d(detaching);
		// TODO null out other refs, including component.$$ (but need to
		// preserve final state?)
		$$.on_destroy = $$.fragment = null;
		$$.ctx = [];
	}
}

/** @returns {void} */
function make_dirty(component, i) {
	if (component.$$.dirty[0] === -1) {
		dirty_components.push(component);
		schedule_update();
		component.$$.dirty.fill(0);
	}
	component.$$.dirty[(i / 31) | 0] |= 1 << i % 31;
}

// TODO: Document the other params
/**
 * @param {SvelteComponent} component
 * @param {import('./public.js').ComponentConstructorOptions} options
 *
 * @param {import('./utils.js')['not_equal']} not_equal Used to compare props and state values.
 * @param {(target: Element | ShadowRoot) => void} [append_styles] Function that appends styles to the DOM when the component is first initialised.
 * This will be the `add_css` function from the compiled component.
 *
 * @returns {void}
 */
function init(
	component,
	options,
	instance,
	create_fragment,
	not_equal,
	props,
	append_styles = null,
	dirty = [-1]
) {
	const parent_component = current_component;
	set_current_component(component);
	/** @type {import('./private.js').T$$} */
	const $$ = (component.$$ = {
		fragment: null,
		ctx: [],
		// state
		props,
		update: noop,
		not_equal,
		bound: blank_object(),
		// lifecycle
		on_mount: [],
		on_destroy: [],
		on_disconnect: [],
		before_update: [],
		after_update: [],
		context: new Map(options.context || (parent_component ? parent_component.$$.context : [])),
		// everything else
		callbacks: blank_object(),
		dirty,
		skip_bound: false,
		root: options.target || parent_component.$$.root
	});
	append_styles && append_styles($$.root);
	let ready = false;
	$$.ctx = instance
		? instance(component, options.props || {}, (i, ret, ...rest) => {
				const value = rest.length ? rest[0] : ret;
				if ($$.ctx && not_equal($$.ctx[i], ($$.ctx[i] = value))) {
					if (!$$.skip_bound && $$.bound[i]) $$.bound[i](value);
					if (ready) make_dirty(component, i);
				}
				return ret;
		  })
		: [];
	$$.update();
	ready = true;
	run_all($$.before_update);
	// `false` as a special case of no DOM component
	$$.fragment = create_fragment ? create_fragment($$.ctx) : false;
	if (options.target) {
		if (options.hydrate) {
			// TODO: what is the correct type here?
			// @ts-expect-error
			const nodes = children(options.target);
			$$.fragment && $$.fragment.l(nodes);
			nodes.forEach(detach);
		} else {
			// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
			$$.fragment && $$.fragment.c();
		}
		if (options.intro) transition_in(component.$$.fragment);
		mount_component(component, options.target, options.anchor);
		flush();
	}
	set_current_component(parent_component);
}

/**
 * Base class for Svelte components. Used when dev=false.
 *
 * @template {Record<string, any>} [Props=any]
 * @template {Record<string, any>} [Events=any]
 */
class SvelteComponent {
	/**
	 * ### PRIVATE API
	 *
	 * Do not use, may change at any time
	 *
	 * @type {any}
	 */
	$$ = undefined;
	/**
	 * ### PRIVATE API
	 *
	 * Do not use, may change at any time
	 *
	 * @type {any}
	 */
	$$set = undefined;

	/** @returns {void} */
	$destroy() {
		destroy_component(this, 1);
		this.$destroy = noop;
	}

	/**
	 * @template {Extract<keyof Events, string>} K
	 * @param {K} type
	 * @param {((e: Events[K]) => void) | null | undefined} callback
	 * @returns {() => void}
	 */
	$on(type, callback) {
		if (!is_function(callback)) {
			return noop;
		}
		const callbacks = this.$$.callbacks[type] || (this.$$.callbacks[type] = []);
		callbacks.push(callback);
		return () => {
			const index = callbacks.indexOf(callback);
			if (index !== -1) callbacks.splice(index, 1);
		};
	}

	/**
	 * @param {Partial<Props>} props
	 * @returns {void}
	 */
	$set(props) {
		if (this.$$set && !is_empty(props)) {
			this.$$.skip_bound = true;
			this.$$set(props);
			this.$$.skip_bound = false;
		}
	}
}

/**
 * @typedef {Object} CustomElementPropDefinition
 * @property {string} [attribute]
 * @property {boolean} [reflect]
 * @property {'String'|'Boolean'|'Number'|'Array'|'Object'} [type]
 */

// generated during release, do not modify

const PUBLIC_VERSION = '4';

if (typeof window !== 'undefined')
	// @ts-ignore
	(window.__svelte || (window.__svelte = { v: new Set() })).v.add(PUBLIC_VERSION);

const config = {
    title: 'iTrip sobre viento'};

/*
 * Parsers for the data produced by the iTrip box (Arduino + GPS + BNO055).
 *
 * Supported inputs:
 *  - GPX (trkpt / rtept / wpt, with <time>, <course>, <speed> and
 *    <extensions> heading/pitch/roll)
 *  - CSV with header (lat, lon, time, heading, pitch, roll, sog, cog ... see ALIASES)
 *    or without header in the order: lat,lon,heading[,sog,pitch,roll]
 *  - NMEA 0183 log ($--RMC, $--GGA, $--HDG/HDT/HDM, $--XDR pitch/roll)
 *  - JSON: array of points, { points: [...] }, a single point, or GeoJSON LineString
 */ const num = (v)=>{
    if (v === null || v === undefined || v === '') {
        return undefined;
    }
    const n = typeof v === 'number' ? v : parseFloat(String(v).replace(',', '.'));
    return Number.isFinite(n) ? n : undefined;
};
const parseTime = (v)=>{
    if (v === null || v === undefined || v === '') {
        return undefined;
    }
    if (typeof v === 'number' || /^\d+(\.\d+)?$/.test(String(v))) {
        const n = Number(v);
        // seconds vs. milliseconds
        return n < 1e11 ? n * 1000 : n;
    }
    const t = Date.parse(String(v));
    return Number.isFinite(t) ? t : undefined;
};
const isValidPos = (p)=>typeof p.lat === 'number' && typeof p.lon === 'number' && Math.abs(p.lat) <= 90 && Math.abs(p.lon) <= 180 && !(p.lat === 0 && p.lon === 0);
/* ------------------------------------------------------------------ */ /* Generic object (JSON / CSV row) */ const ALIASES = {
    lat: [
        'lat',
        'latitude',
        'latitud',
        'y'
    ],
    lon: [
        'lon',
        'lng',
        'long',
        'longitude',
        'longitud',
        'x'
    ],
    t: [
        't',
        'time',
        'timestamp',
        'ts',
        'datetime',
        'date',
        'fecha',
        'hora',
        'utc'
    ],
    heading: [
        'heading',
        'hdg',
        'yaw',
        'rumbo',
        'head',
        'compass',
        'euler_x',
        'ex'
    ],
    pitch: [
        'pitch',
        'cabeceo',
        'euler_z',
        'ez'
    ],
    roll: [
        'roll',
        'heel',
        'escora',
        'alabeo',
        'euler_y',
        'ey'
    ],
    sog: [
        'sog',
        'speed',
        'velocidad',
        'vel',
        'kn',
        'knots',
        'nudos'
    ],
    cog: [
        'cog',
        'course',
        'rumbo_fondo',
        'track'
    ]
};
const normKey = (k)=>k.trim().toLowerCase().replace(/[\s\-()[\]°]/g, '');
const findKey = (obj, field)=>{
    for (const key of Object.keys(obj)){
        if (ALIASES[field].includes(normKey(key))) {
            return obj[key];
        }
    }
    return undefined;
};
const objectToPoint = (obj)=>{
    const p = {
        lat: num(findKey(obj, 'lat')),
        lon: num(findKey(obj, 'lon')),
        t: parseTime(findKey(obj, 't')),
        heading: num(findKey(obj, 'heading')),
        pitch: num(findKey(obj, 'pitch')),
        roll: num(findKey(obj, 'roll')),
        sog: num(findKey(obj, 'sog')),
        cog: num(findKey(obj, 'cog'))
    };
    // Nested { gps: {lat, lon}, imu: {heading} } style
    for (const v of Object.values(obj)){
        if (v && typeof v === 'object' && !Array.isArray(v)) {
            const nested = objectToPoint(v);
            for (const k of Object.keys(nested)){
                if (p[k] === undefined && nested[k] !== undefined) {
                    p[k] = nested[k];
                }
            }
        }
    }
    for (const k of Object.keys(p)){
        if (p[k] === undefined) {
            delete p[k];
        }
    }
    return p;
};
/* ------------------------------------------------------------------ */ /* GPX */ const parseGpx = (text)=>{
    const doc = new DOMParser().parseFromString(text, 'application/xml');
    const nodes = Array.from(doc.querySelectorAll('trkpt, rtept'));
    const list = nodes.length ? nodes : Array.from(doc.querySelectorAll('wpt'));
    const child = (el, names)=>{
        for (const d of Array.from(el.getElementsByTagName('*'))){
            if (names.includes(d.localName.toLowerCase())) {
                return d.textContent ?? undefined;
            }
        }
        return undefined;
    };
    const points = [];
    for (const el of list){
        const p = {
            lat: num(el.getAttribute('lat')),
            lon: num(el.getAttribute('lon')),
            t: parseTime(child(el, [
                'time'
            ])),
            heading: num(child(el, [
                'heading',
                'hdg',
                'yaw'
            ])),
            pitch: num(child(el, [
                'pitch'
            ])),
            roll: num(child(el, [
                'roll',
                'heel'
            ])),
            cog: num(child(el, [
                'course',
                'cog'
            ]))
        };
        const speedMs = num(child(el, [
            'speed'
        ]));
        if (speedMs !== undefined) {
            p.sog = speedMs * 1.943844; // GPX speed is m/s
        }
        if (isValidPos(p)) {
            points.push(p);
        }
    }
    return points;
};
/* ------------------------------------------------------------------ */ /* NMEA 0183 */ const nmeaCoord = (value, hemi)=>{
    const v = parseFloat(value);
    if (!Number.isFinite(v)) {
        return undefined;
    }
    const deg = Math.floor(v / 100);
    const dec = deg + (v - deg * 100) / 60;
    return hemi === 'S' || hemi === 'W' ? -dec : dec;
};
const nmeaChecksumOk = (line)=>{
    const star = line.indexOf('*');
    if (star < 0) {
        return true; // no checksum, accept
    }
    let sum = 0;
    for(let i = 1; i < star; i++){
        sum ^= line.charCodeAt(i);
    }
    return sum === parseInt(line.slice(star + 1, star + 3), 16);
};
/**
 * Parse a single NMEA sentence into a partial point.
 * `dateHint` (epoch ms of 00:00 UTC of the day) is used for GGA, which has no date.
 */ const parseNmeaSentence = (raw, dateHint)=>{
    const line = raw.trim();
    if (!/^[$!]/.test(line) || !nmeaChecksumOk(line)) {
        return null;
    }
    const f = line.split('*')[0].split(',');
    const type = f[0].slice(3).toUpperCase();
    const hmsToMs = (hms)=>{
        if (!/^\d{6}/.test(hms)) {
            return undefined;
        }
        const h = +hms.slice(0, 2);
        const m = +hms.slice(2, 4);
        const s = parseFloat(hms.slice(4));
        return ((h * 60 + m) * 60 + s) * 1000;
    };
    switch(type){
        case 'RMC':
            {
                if (f[2] !== 'A') {
                    return {
                        point: {},
                        hasPosition: false
                    };
                }
                let dayStart;
                if (/^\d{6}$/.test(f[9])) {
                    const dd = +f[9].slice(0, 2);
                    const mm = +f[9].slice(2, 4);
                    const yy = +f[9].slice(4, 6);
                    dayStart = Date.UTC(2000 + yy, mm - 1, dd);
                }
                const tod = hmsToMs(f[1]);
                const base = dayStart ?? dateHint;
                return {
                    point: {
                        lat: nmeaCoord(f[3], f[4]),
                        lon: nmeaCoord(f[5], f[6]),
                        sog: num(f[7]),
                        cog: num(f[8]),
                        t: base !== undefined && tod !== undefined ? base + tod : undefined
                    },
                    hasPosition: true,
                    dayStart
                };
            }
        case 'GGA':
            {
                if (!f[6] || f[6] === '0') {
                    return {
                        point: {},
                        hasPosition: false
                    };
                }
                const tod = hmsToMs(f[1]);
                return {
                    point: {
                        lat: nmeaCoord(f[2], f[3]),
                        lon: nmeaCoord(f[4], f[5]),
                        t: dateHint !== undefined && tod !== undefined ? dateHint + tod : undefined
                    },
                    hasPosition: true
                };
            }
        case 'HDG':
            {
                // magnetic heading + optional variation
                const h = num(f[1]);
                const varDeg = num(f[4]);
                if (h === undefined) {
                    return null;
                }
                const variation = varDeg === undefined ? 0 : f[5] === 'W' ? -varDeg : varDeg;
                return {
                    point: {
                        heading: h + variation
                    },
                    hasPosition: false
                };
            }
        case 'HDT':
        case 'HDM':
            {
                const h = num(f[1]);
                return h === undefined ? null : {
                    point: {
                        heading: h
                    },
                    hasPosition: false
                };
            }
        case 'XDR':
            {
                // $IIXDR,A,-2.1,D,PTCH,A,5.4,D,ROLL*hh
                const point = {};
                for(let i = 1; i + 3 < f.length; i += 4){
                    const name = (f[i + 3] || '').toUpperCase();
                    const v = num(f[i + 1]);
                    if (v === undefined) {
                        continue;
                    }
                    if (name.startsWith('PTCH') || name.startsWith('PITCH')) {
                        point.pitch = v;
                    } else if (name.startsWith('ROLL') || name.startsWith('HEEL')) {
                        point.roll = v;
                    } else if (name.startsWith('YAW') || name.startsWith('HEAD')) {
                        point.heading = v;
                    }
                }
                return {
                    point,
                    hasPosition: false
                };
            }
        default:
            return null;
    }
};
const parseNmea = (text)=>{
    const points = [];
    let attitude = {};
    let dayStart;
    let current = null;
    const flush = ()=>{
        if (current && isValidPos(current)) {
            points.push({
                ...attitude,
                ...current
            });
        }
        current = null;
    };
    for (const line of text.split(/\r?\n/)){
        const res = parseNmeaSentence(line, dayStart);
        if (!res) {
            continue;
        }
        if (res.dayStart !== undefined) {
            dayStart = res.dayStart;
        }
        if (!res.hasPosition) {
            attitude = {
                ...attitude,
                ...res.point
            };
            if (current) {
                Object.assign(current, res.point);
            }
            continue;
        }
        // Merge GGA + RMC of the same fix (same time), otherwise start a new point
        if (current && res.point.t !== undefined && current.t === res.point.t) {
            Object.assign(current, res.point);
        } else {
            flush();
            current = {
                ...attitude,
                ...res.point
            };
        }
    }
    flush();
    return points;
};
/* ------------------------------------------------------------------ */ /* CSV */ const splitCsv = (line, sep)=>line.split(sep).map((s)=>s.trim().replace(/^"(.*)"$/, '$1'));
const detectSep = (line)=>{
    const candidates = [
        '\t',
        ';',
        ','
    ];
    let best = ',';
    let bestCount = 0;
    for (const c of candidates){
        const n = line.split(c).length;
        if (n > bestCount) {
            best = c;
            bestCount = n;
        }
    }
    return best;
};
/** Positional CSV without header: lat,lon,heading[,sog,pitch,roll] */ const positionalCsvToPoint = (cols)=>{
    const [lat, lon, heading, sog, pitch, roll] = cols.map((c)=>num(c));
    const p = {
        lat,
        lon,
        heading,
        sog,
        pitch,
        roll
    };
    for (const k of Object.keys(p)){
        if (p[k] === undefined) {
            delete p[k];
        }
    }
    return p;
};
const parseCsv = (text)=>{
    const lines = text.split(/\r?\n/).map((l)=>l.trim()).filter((l)=>l && !l.startsWith('#'));
    if (!lines.length) {
        return [];
    }
    const sep = detectSep(lines[0]);
    const first = splitCsv(lines[0], sep);
    const hasHeader = first.some((c)=>!Number.isFinite(parseFloat(c)));
    const points = [];
    if (hasHeader) {
        for (const line of lines.slice(1)){
            const cols = splitCsv(line, sep);
            const obj = {};
            first.forEach((h, i)=>obj[h] = cols[i]);
            const p = objectToPoint(obj);
            if (isValidPos(p)) {
                points.push(p);
            }
        }
    } else {
        for (const line of lines){
            const p = positionalCsvToPoint(splitCsv(line, sep));
            if (isValidPos(p)) {
                points.push(p);
            }
        }
    }
    return points;
};
/* ------------------------------------------------------------------ */ /* JSON */ const parseJson = (text)=>{
    const data = JSON.parse(text);
    // GeoJSON
    if (data && (data.type === 'FeatureCollection' || data.type === 'Feature')) {
        const features = data.type === 'Feature' ? [
            data
        ] : data.features;
        const pts = [];
        for (const f of features){
            const g = f.geometry;
            const coords = g?.type === 'LineString' ? g.coordinates : g?.type === 'MultiLineString' ? g.coordinates.flat() : g?.type === 'Point' ? [
                g.coordinates
            ] : [];
            const times = f.properties?.coordTimes || f.properties?.times || [];
            coords.forEach((c, i)=>{
                const p = {
                    lon: c[0],
                    lat: c[1],
                    t: parseTime(times[i])
                };
                if (g?.type === 'Point') {
                    Object.assign(p, objectToPoint(f.properties || {}), {
                        lon: c[0],
                        lat: c[1]
                    });
                }
                if (p.t === undefined) {
                    delete p.t;
                }
                if (isValidPos(p)) {
                    pts.push(p);
                }
            });
        }
        return pts;
    }
    const arr = Array.isArray(data) ? data : Array.isArray(data?.points) ? data.points : Array.isArray(data?.track) ? data.track : [
        data
    ];
    const points = [];
    for (const item of arr){
        const p = Array.isArray(item) ? positionalCsvToPoint(item.map(String)) : objectToPoint(item);
        if (isValidPos(p)) {
            points.push(p);
        }
    }
    return points;
};
/* ------------------------------------------------------------------ */ /** Parse a whole file, guessing its format from name and content. */ const parseFile = (name, text)=>{
    const lower = name.toLowerCase();
    const trimmed = text.trimStart();
    let points;
    if (lower.endsWith('.gpx') || trimmed.startsWith('<')) {
        points = parseGpx(text);
    } else if (lower.endsWith('.json') || lower.endsWith('.geojson') || /^[[{]/.test(trimmed)) {
        points = parseJson(text);
    } else if (lower.endsWith('.nmea') || /^[$!]/.test(trimmed)) {
        points = parseNmea(text);
    } else {
        points = parseCsv(text);
    }
    // Sort by time when every point has one
    if (points.length && points.every((p)=>p.t !== undefined)) {
        points.sort((a, b)=>a.t - b.t);
    }
    return points;
};
/**
 * Parses one line of a live stream (USB serial or HTTP response).
 * Accepts NMEA sentences, JSON objects or positional CSV.
 */ const parseLiveLine = (line)=>{
    const l = line.trim();
    if (!l) {
        return null;
    }
    if (/^[$!]/.test(l)) {
        const today = new Date();
        const res = parseNmeaSentence(l, Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()));
        return res ? {
            point: res.point,
            hasPosition: res.hasPosition
        } : null;
    }
    if (l.startsWith('{')) {
        try {
            const p = objectToPoint(JSON.parse(l));
            return {
                point: p,
                hasPosition: isValidPos(p)
            };
        } catch  {
            return null;
        }
    }
    const sep = detectSep(l);
    const cols = splitCsv(l, sep);
    if (cols.some((c)=>!Number.isFinite(parseFloat(c)))) {
        return null; // header or debug text
    }
    const p = positionalCsvToPoint(cols);
    return {
        point: p,
        hasPosition: isValidPos(p)
    };
};

/** Normalize angle to [0, 360) */ const norm360 = (a)=>(a % 360 + 360) % 360;
/** Normalize angle to (-180, 180] */ const norm180 = (a)=>{
    const n = norm360(a);
    return n > 180 ? n - 360 : n;
};
/**
 * True wind angle relative to the bow.
 * @param windFrom direction the wind blows FROM (meteorological), degrees
 * @param heading boat heading, degrees
 * @returns signed angle: positive = starboard (estribor), negative = port (babor)
 */ const trueWindAngle = (windFrom, heading)=>norm180(windFrom - heading);
/** Point of sail in Spanish for a given |TWA| */ const pointOfSail = (twa)=>{
    const a = Math.abs(twa);
    if (a < 35) {
        return 'Proa al viento';
    }
    if (a < 60) {
        return 'Ceñida';
    }
    if (a < 80) {
        return 'Descuartelar';
    }
    if (a < 100) {
        return 'Través';
    }
    if (a < 150) {
        return 'Largo';
    }
    if (a < 170) {
        return 'Aleta';
    }
    return 'Popa';
};
const toRad = (d)=>d * Math.PI / 180;
/** Great circle distance in nautical miles */ const distanceNm = (lat1, lon1, lat2, lon2)=>{
    const R = 3440.065;
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
    return 2 * R * Math.asin(Math.min(1, Math.sqrt(a)));
};
/**
 * Position relative to a reference route (list of [lat, lon]).
 * Uses a local flat projection, accurate enough for a few hundred NM.
 * @returns xte: distance to the route (NM), remaining: distance along the
 *          route from the closest point to its end (NM)
 */ const routeProgress = (lat, lon, route)=>{
    if (route.length < 2) {
        return null;
    }
    const kx = 60 * Math.cos(toRad(lat)); // NM per degree of longitude
    const ky = 60;
    let best = Infinity;
    let bestIdx = 0;
    let bestT = 0;
    for(let i = 0; i < route.length - 1; i++){
        const ax = (route[i][1] - lon) * kx;
        const ay = (route[i][0] - lat) * ky;
        const bx = (route[i + 1][1] - lon) * kx;
        const by = (route[i + 1][0] - lat) * ky;
        const dx = bx - ax;
        const dy = by - ay;
        const len2 = dx * dx + dy * dy;
        const t = len2 ? Math.max(0, Math.min(1, -(ax * dx + ay * dy) / len2)) : 0;
        const px = ax + t * dx;
        const py = ay + t * dy;
        const d = Math.hypot(px, py);
        if (d < best) {
            best = d;
            bestIdx = i;
            bestT = t;
        }
    }
    const [aLat, aLon] = route[bestIdx];
    const [bLat, bLon] = route[bestIdx + 1];
    let remaining = (1 - bestT) * distanceNm(aLat, aLon, bLat, bLon);
    for(let i = bestIdx + 1; i < route.length - 1; i++){
        remaining += distanceNm(route[i][0], route[i][1], route[i + 1][0], route[i + 1][1]);
    }
    return {
        xte: best,
        remaining
    };
};
/** Total length of a route in NM */ const routeLength = (route)=>{
    let d = 0;
    for(let i = 1; i < route.length; i++){
        d += distanceNm(route[i - 1][0], route[i - 1][1], route[i][0], route[i][1]);
    }
    return d;
};
/** Initial bearing from point 1 to point 2, degrees */ const bearing = (lat1, lon1, lat2, lon2)=>{
    const y = Math.sin(toRad(lon2 - lon1)) * Math.cos(toRad(lat2));
    const x = Math.cos(toRad(lat1)) * Math.sin(toRad(lat2)) - Math.sin(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.cos(toRad(lon2 - lon1));
    return norm360(Math.atan2(y, x) * 180 / Math.PI);
};

/**
 * Marker for the iTrip boat: a hull rotated with the BNO055 heading and an
 * outer arrow showing where the true wind comes from (rotated by TWD).
 *
 * Inline styles are used because the marker lives outside the plugin's DOM,
 * so scoped Svelte styles would not reach it.
 */ const BOAT_SIZE = 64;
const createBoatIcon = ()=>L.divIcon({
        className: 'itrip-marker',
        html: `
<div style="position:relative;width:${BOAT_SIZE}px;height:${BOAT_SIZE}px;pointer-events:none;">
    <div class="itrip-wind" style="position:absolute;inset:0;transition:transform .4s;display:none;">
        <svg viewBox="0 0 64 64" width="${BOAT_SIZE}" height="${BOAT_SIZE}">
            <path d="M32 2 L39 14 L34 12 L34 20 L30 20 L30 12 L25 14 Z"
                fill="#ffd400" stroke="#000" stroke-width="1" stroke-linejoin="round"/>
        </svg>
    </div>
    <div class="itrip-boat" style="position:absolute;inset:0;transition:transform .4s;">
        <svg viewBox="0 0 64 64" width="${BOAT_SIZE}" height="${BOAT_SIZE}">
            <path d="M32 14 C38 22 40 32 39 50 L25 50 C24 32 26 22 32 14 Z"
                fill="#ff2d6f" stroke="#fff" stroke-width="2" stroke-linejoin="round"/>
            <line x1="32" y1="22" x2="32" y2="44" stroke="#fff" stroke-width="1.5"/>
        </svg>
    </div>
</div>`,
        iconSize: [
            BOAT_SIZE,
            BOAT_SIZE
        ],
        iconAnchor: [
            BOAT_SIZE / 2,
            BOAT_SIZE / 2
        ]
    });
const setBoatRotation = (marker, heading)=>{
    const el = marker?.getElement()?.querySelector('.itrip-boat');
    if (el) {
        el.style.transform = `rotate(${heading ?? 0}deg)`;
    }
};
const setWindArrow = (marker, windFrom)=>{
    const el = marker?.getElement()?.querySelector('.itrip-wind');
    if (el) {
        el.style.display = windFrom === null ? 'none' : 'block';
        el.style.transform = `rotate(${windFrom ?? 0}deg)`;
    }
};

const isSerialSupported = ()=>'serial' in navigator;
/**
 * Connects to the iTrip box over USB and reads lines (NMEA, JSON or CSV).
 * Must be called from a user gesture (button click).
 */ const startSerial = async (baudRate, onPoint)=>{
    const serial = navigator.serial;
    const port = await serial.requestPort();
    await port.open({
        baudRate
    });
    let stopped = false;
    let reader = null;
    const decoder = new TextDecoderStream();
    const pipeDone = port.readable ? port.readable.pipeTo(decoder.writable).catch(()=>{}) : Promise.resolve();
    const loop = async ()=>{
        reader = decoder.readable.getReader();
        let buffer = '';
        try {
            while(!stopped){
                const { value, done } = await reader.read();
                if (done) {
                    break;
                }
                buffer += value;
                const lines = buffer.split(/\r?\n/);
                buffer = lines.pop() ?? '';
                for (const line of lines){
                    const res = parseLiveLine(line);
                    if (res) {
                        onPoint(res.point, res.hasPosition);
                    }
                }
            }
        } catch (e) {
            console.warn('iTrip serial read error', e);
        } finally{
            reader.releaseLock();
        }
    };
    loop();
    return {
        stop: async ()=>{
            stopped = true;
            try {
                await reader?.cancel();
            } catch  {
            /* ignore */ }
            await pipeDone;
            try {
                await port.close();
            } catch  {
            /* ignore */ }
        }
    };
};
/* ------------------------------------------------------------------ */ /* GPS (and optionally compass) of the tablet / phone running Windy */ const isGeolocationSupported = ()=>'geolocation' in navigator;
/**
 * Uses the device's own GPS. Position fixes give lat/lon/SOG/COG.
 * If `useCompass` is set, the device compass is used as heading (the tablet
 * must be mounted aligned with the bow); otherwise heading falls back to COG.
 * Must be called from a user gesture (iOS asks for compass permission).
 */ const startGeolocation = async (useCompass, onPoint, onError)=>{
    let removeCompass = ()=>{};
    if (useCompass) {
        const Ctor = window.DeviceOrientationEvent;
        if (Ctor?.requestPermission) {
            const res = await Ctor.requestPermission().catch(()=>'denied');
            if (res !== 'granted') {
                onError('Permiso de brújula denegado: se usará el rumbo del GPS (COG).');
            }
        }
        const eventName = 'ondeviceorientationabsolute' in window ? 'deviceorientationabsolute' : 'deviceorientation';
        let lastEmit = 0;
        const handler = (ev)=>{
            const e = ev;
            let h;
            if (typeof e.webkitCompassHeading === 'number') {
                h = e.webkitCompassHeading; // iOS, already compensated
            } else if (e.alpha !== null && (e.absolute || eventName === 'deviceorientationabsolute')) {
                h = 360 - e.alpha + (screen.orientation?.angle ?? 0);
            }
            const now = Date.now();
            if (h === undefined || now - lastEmit < 250) {
                return;
            }
            lastEmit = now;
            onPoint({
                heading: (h % 360 + 360) % 360
            }, false);
        };
        window.addEventListener(eventName, handler);
        removeCompass = ()=>window.removeEventListener(eventName, handler);
    }
    const watchId = navigator.geolocation.watchPosition((pos)=>{
        const { latitude, longitude, speed, heading } = pos.coords;
        const p = {
            lat: latitude,
            lon: longitude,
            t: pos.timestamp
        };
        if (speed !== null && Number.isFinite(speed)) {
            p.sog = speed * 1.943844;
        }
        if (heading !== null && Number.isFinite(heading) && (speed ?? 0) > 0.3) {
            p.cog = heading;
        }
        onPoint(p, true);
        onError('');
    }, (err)=>{
        onError(err.code === err.PERMISSION_DENIED ? 'Permiso de ubicación denegado. Actívalo para windy.com en el navegador.' : `GPS: ${err.message}`);
    }, {
        enableHighAccuracy: true,
        maximumAge: 0,
        timeout: 30000
    });
    return {
        stop: async ()=>{
            navigator.geolocation.clearWatch(watchId);
            removeCompass();
        }
    };
};
/* ------------------------------------------------------------------ */ /* HTTP polling (e.g. ESP32/ESP8266 web server in the box, or a cloud relay) */ /**
 * Polls `url` every `intervalMs`. The response can be:
 *  - a JSON object with the latest point  {lat, lon, heading, sog, pitch, roll, time}
 *  - a JSON array / {points:[...]} (the last element is used)
 *  - plain text with one or more NMEA / CSV lines
 */ const startHttpPolling = (url, intervalMs, onPoint, onError)=>{
    let stopped = false;
    let timer = null;
    const tick = async ()=>{
        if (stopped) {
            return;
        }
        try {
            const res = await fetch(url, {
                cache: 'no-store'
            });
            if (!res.ok) {
                throw new Error(`HTTP ${res.status}`);
            }
            const text = await res.text();
            const trimmed = text.trim();
            if (/^[[{]/.test(trimmed)) {
                const pts = parseJson(trimmed);
                const last = pts[pts.length - 1];
                if (last) {
                    onPoint(last, true);
                } else {
                    // object with only attitude data
                    const r = parseLiveLine(trimmed.replace(/\s+/g, ' '));
                    if (r) {
                        onPoint(r.point, r.hasPosition);
                    }
                }
            } else {
                for (const line of trimmed.split(/\r?\n/)){
                    const r = parseLiveLine(line);
                    if (r) {
                        onPoint(r.point, r.hasPosition);
                    }
                }
            }
            onError('');
        } catch (e) {
            onError(`No se pudo leer ${url}: ${e.message}. ` + 'Recuerda que Windy es HTTPS: el servidor debe ser HTTPS y enviar CORS (Access-Control-Allow-Origin: *).');
        }
        if (!stopped) {
            timer = setTimeout(tick, intervalMs);
        }
    };
    tick();
    return {
        stop: async ()=>{
            stopped = true;
            if (timer) {
                clearTimeout(timer);
            }
        }
    };
};

/* src/plugin.svelte generated by Svelte v4.2.20 */

function add_css(target) {
	append_styles(target, "svelte-118nlww", ".itrip.svelte-118nlww.svelte-118nlww{padding-top:5px}.tabs.svelte-118nlww.svelte-118nlww{display:flex;gap:4px}.tabs.svelte-118nlww .tab.svelte-118nlww{flex:1;text-align:center;padding:5px 0;border-radius:4px;background:rgba(255, 255, 255, 0.08);font-size:12px}.tabs.svelte-118nlww .tab.active.svelte-118nlww{background:#ff2d6f;color:#fff}.file-btn.svelte-118nlww.svelte-118nlww{display:block;text-align:center;position:relative;overflow:hidden}.file-btn.svelte-118nlww input.svelte-118nlww{position:absolute;inset:0;opacity:0;cursor:pointer}.row.svelte-118nlww.svelte-118nlww{display:flex;align-items:center;justify-content:space-between;gap:8px}.url-input.svelte-118nlww.svelte-118nlww{width:100%;box-sizing:border-box;padding:5px}.card.svelte-118nlww.svelte-118nlww{padding:8px;border-radius:6px;background:rgba(255, 255, 255, 0.06)}.card.wind.svelte-118nlww.svelte-118nlww{border-left:4px solid #ffd400}.grid.svelte-118nlww.svelte-118nlww{display:grid;grid-template-columns:1fr 1fr;gap:6px 10px;font-size:14px}.lbl.svelte-118nlww.svelte-118nlww{display:block;font-size:10px;opacity:0.6;text-transform:uppercase}.slider.svelte-118nlww.svelte-118nlww{width:100%}.check.svelte-118nlww.svelte-118nlww{display:flex;align-items:center;gap:6px;margin-bottom:4px}.warn.svelte-118nlww.svelte-118nlww{color:#ffb347}.stats.svelte-118nlww.svelte-118nlww{opacity:0.8}.hint.svelte-118nlww.svelte-118nlww{opacity:0.75}.ref.svelte-118nlww.svelte-118nlww{border-top:1px solid rgba(255, 255, 255, 0.15);padding-top:8px}.ref-swatch.svelte-118nlww.svelte-118nlww{display:inline-block;width:18px;border-top:3px dashed #00e5ff;vertical-align:middle;margin-right:4px}.disabled.svelte-118nlww.svelte-118nlww{opacity:0.4;pointer-events:none}");
}

function get_each_context_1(ctx, list, i) {
	const child_ctx = ctx.slice();
	child_ctx[87] = list[i];
	return child_ctx;
}

function get_each_context(ctx, list, i) {
	const child_ctx = ctx.slice();
	child_ctx[84] = list[i];
	return child_ctx;
}

// (5:4) {#if !isMobileOrTablet}
function create_if_block_17(ctx) {
	let div;
	let mounted;
	let dispose;

	return {
		c() {
			div = element("div");
			div.textContent = `${/*title*/ ctx[21]}`;
			attr(div, "class", "plugin__title plugin__title--chevron-back");
		},
		m(target, anchor) {
			insert(target, div, anchor);

			if (!mounted) {
				dispose = listen(div, "click", /*click_handler*/ ctx[39]);
				mounted = true;
			}
		},
		p: noop,
		d(detaching) {
			if (detaching) {
				detach(div);
			}

			mounted = false;
			dispose();
		}
	};
}

// (66:4) {:else}
function create_else_block_5(ctx) {
	let input;
	let input_disabled_value;
	let t0;
	let div;
	let span;
	let t2;
	let select;
	let select_disabled_value;
	let mounted;
	let dispose;
	let each_value_1 = ensure_array_like([1, 2, 5, 10, 30, 60]);
	let each_blocks = [];

	for (let i = 0; i < 6; i += 1) {
		each_blocks[i] = create_each_block_1(get_each_context_1(ctx, each_value_1, i));
	}

	return {
		c() {
			input = element("input");
			t0 = space();
			div = element("div");
			span = element("span");
			span.textContent = "Cada";
			t2 = space();
			select = element("select");

			for (let i = 0; i < 6; i += 1) {
				each_blocks[i].c();
			}

			attr(input, "class", "url-input mb-5 svelte-118nlww");
			attr(input, "type", "text");
			attr(input, "placeholder", "https://mi-itrip.local/data.json");
			input.disabled = input_disabled_value = !!/*live*/ ctx[13];
			attr(span, "class", "size-xs");
			select.disabled = select_disabled_value = !!/*live*/ ctx[13];
			if (/*pollSeconds*/ ctx[3] === void 0) add_render_callback(() => /*select_change_handler_1*/ ctx[47].call(select));
			attr(div, "class", "row mb-10 svelte-118nlww");
		},
		m(target, anchor) {
			insert(target, input, anchor);
			set_input_value(input, /*httpUrl*/ ctx[2]);
			insert(target, t0, anchor);
			insert(target, div, anchor);
			append(div, span);
			append(div, t2);
			append(div, select);

			for (let i = 0; i < 6; i += 1) {
				if (each_blocks[i]) {
					each_blocks[i].m(select, null);
				}
			}

			select_option(select, /*pollSeconds*/ ctx[3], true);

			if (!mounted) {
				dispose = [
					listen(input, "input", /*input_input_handler*/ ctx[46]),
					listen(select, "change", /*select_change_handler_1*/ ctx[47])
				];

				mounted = true;
			}
		},
		p(ctx, dirty) {
			if (dirty[0] & /*live*/ 8192 && input_disabled_value !== (input_disabled_value = !!/*live*/ ctx[13])) {
				input.disabled = input_disabled_value;
			}

			if (dirty[0] & /*httpUrl*/ 4 && input.value !== /*httpUrl*/ ctx[2]) {
				set_input_value(input, /*httpUrl*/ ctx[2]);
			}

			if (dirty[0] & /*live*/ 8192 && select_disabled_value !== (select_disabled_value = !!/*live*/ ctx[13])) {
				select.disabled = select_disabled_value;
			}

			if (dirty[0] & /*pollSeconds*/ 8) {
				select_option(select, /*pollSeconds*/ ctx[3]);
			}
		},
		d(detaching) {
			if (detaching) {
				detach(input);
				detach(t0);
				detach(div);
			}

			destroy_each(each_blocks, detaching);
			mounted = false;
			run_all(dispose);
		}
	};
}

// (51:34) 
function create_if_block_15(ctx) {
	let if_block_anchor;

	function select_block_type_2(ctx, dirty) {
		if (!/*serialSupported*/ ctx[22]) return create_if_block_16;
		return create_else_block_4;
	}

	let current_block_type = select_block_type_2(ctx);
	let if_block = current_block_type(ctx);

	return {
		c() {
			if_block.c();
			if_block_anchor = empty();
		},
		m(target, anchor) {
			if_block.m(target, anchor);
			insert(target, if_block_anchor, anchor);
		},
		p(ctx, dirty) {
			if_block.p(ctx, dirty);
		},
		d(detaching) {
			if (detaching) {
				detach(if_block_anchor);
			}

			if_block.d(detaching);
		}
	};
}

// (39:31) 
function create_if_block_13(ctx) {
	let if_block_anchor;

	function select_block_type_1(ctx, dirty) {
		if (!/*geoSupported*/ ctx[23]) return create_if_block_14;
		return create_else_block_3;
	}

	let current_block_type = select_block_type_1(ctx);
	let if_block = current_block_type(ctx);

	return {
		c() {
			if_block.c();
			if_block_anchor = empty();
		},
		m(target, anchor) {
			if_block.m(target, anchor);
			insert(target, if_block_anchor, anchor);
		},
		p(ctx, dirty) {
			if_block.p(ctx, dirty);
		},
		d(detaching) {
			if (detaching) {
				detach(if_block_anchor);
			}

			if_block.d(detaching);
		}
	};
}

// (34:4) {#if source === 'file'}
function create_if_block_12(ctx) {
	let label;
	let t;
	let input;
	let mounted;
	let dispose;

	return {
		c() {
			label = element("label");
			t = text("Cargar track (GPX, CSV, NMEA, JSON)\n            ");
			input = element("input");
			attr(input, "type", "file");
			attr(input, "class", "svelte-118nlww");
			attr(label, "class", "button button--variant-orange size-s mb-10 file-btn svelte-118nlww");
		},
		m(target, anchor) {
			insert(target, label, anchor);
			append(label, t);
			append(label, input);

			if (!mounted) {
				dispose = listen(input, "change", /*onFile*/ ctx[34]);
				mounted = true;
			}
		},
		p: noop,
		d(detaching) {
			if (detaching) {
				detach(label);
			}

			mounted = false;
			dispose();
		}
	};
}

// (77:16) {#each [1, 2, 5, 10, 30, 60] as s}
function create_each_block_1(ctx) {
	let option;

	return {
		c() {
			option = element("option");
			option.textContent = `${/*s*/ ctx[87]} s`;
			option.__value = /*s*/ ctx[87];
			set_input_value(option, option.__value);
		},
		m(target, anchor) {
			insert(target, option, anchor);
		},
		p: noop,
		d(detaching) {
			if (detaching) {
				detach(option);
			}
		}
	};
}

// (56:8) {:else}
function create_else_block_4(ctx) {
	let div;
	let span;
	let t1;
	let select;
	let select_disabled_value;
	let mounted;
	let dispose;
	let each_value = ensure_array_like([4800, 9600, 19200, 38400, 57600, 115200]);
	let each_blocks = [];

	for (let i = 0; i < 6; i += 1) {
		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
	}

	return {
		c() {
			div = element("div");
			span = element("span");
			span.textContent = "Baudios";
			t1 = space();
			select = element("select");

			for (let i = 0; i < 6; i += 1) {
				each_blocks[i].c();
			}

			attr(span, "class", "size-xs");
			select.disabled = select_disabled_value = !!/*live*/ ctx[13];
			if (/*baudRate*/ ctx[1] === void 0) add_render_callback(() => /*select_change_handler*/ ctx[45].call(select));
			attr(div, "class", "row mb-10 svelte-118nlww");
		},
		m(target, anchor) {
			insert(target, div, anchor);
			append(div, span);
			append(div, t1);
			append(div, select);

			for (let i = 0; i < 6; i += 1) {
				if (each_blocks[i]) {
					each_blocks[i].m(select, null);
				}
			}

			select_option(select, /*baudRate*/ ctx[1], true);

			if (!mounted) {
				dispose = listen(select, "change", /*select_change_handler*/ ctx[45]);
				mounted = true;
			}
		},
		p(ctx, dirty) {
			if (dirty[0] & /*live*/ 8192 && select_disabled_value !== (select_disabled_value = !!/*live*/ ctx[13])) {
				select.disabled = select_disabled_value;
			}

			if (dirty[0] & /*baudRate*/ 2) {
				select_option(select, /*baudRate*/ ctx[1]);
			}
		},
		d(detaching) {
			if (detaching) {
				detach(div);
			}

			destroy_each(each_blocks, detaching);
			mounted = false;
			dispose();
		}
	};
}

// (52:8) {#if !serialSupported}
function create_if_block_16(ctx) {
	let p;

	return {
		c() {
			p = element("p");
			p.textContent = "Tu navegador no soporta Web Serial. Usa Chrome o Edge de escritorio.";
			attr(p, "class", "size-xs warn svelte-118nlww");
		},
		m(target, anchor) {
			insert(target, p, anchor);
		},
		p: noop,
		d(detaching) {
			if (detaching) {
				detach(p);
			}
		}
	};
}

// (60:20) {#each [4800, 9600, 19200, 38400, 57600, 115200] as b}
function create_each_block(ctx) {
	let option;

	return {
		c() {
			option = element("option");
			option.textContent = `${/*b*/ ctx[84]}`;
			option.__value = /*b*/ ctx[84];
			set_input_value(option, option.__value);
		},
		m(target, anchor) {
			insert(target, option, anchor);
		},
		p: noop,
		d(detaching) {
			if (detaching) {
				detach(option);
			}
		}
	};
}

// (42:8) {:else}
function create_else_block_3(ctx) {
	let p;
	let t1;
	let label;
	let input;
	let input_disabled_value;
	let t2;
	let mounted;
	let dispose;

	return {
		c() {
			p = element("p");
			p.textContent = "Usa el GPS de este dispositivo. El pronóstico se mantiene en la hora actual.";
			t1 = space();
			label = element("label");
			input = element("input");
			t2 = text("\n                Rumbo con la brújula (tablet alineada con la proa)");
			attr(p, "class", "size-xs mb-5 hint svelte-118nlww");
			attr(input, "type", "checkbox");
			input.disabled = input_disabled_value = !!/*live*/ ctx[13];
			attr(label, "class", "size-xs check mb-10 svelte-118nlww");
		},
		m(target, anchor) {
			insert(target, p, anchor);
			insert(target, t1, anchor);
			insert(target, label, anchor);
			append(label, input);
			input.checked = /*useCompass*/ ctx[6];
			append(label, t2);

			if (!mounted) {
				dispose = listen(input, "change", /*input_change_handler*/ ctx[44]);
				mounted = true;
			}
		},
		p(ctx, dirty) {
			if (dirty[0] & /*live*/ 8192 && input_disabled_value !== (input_disabled_value = !!/*live*/ ctx[13])) {
				input.disabled = input_disabled_value;
			}

			if (dirty[0] & /*useCompass*/ 64) {
				input.checked = /*useCompass*/ ctx[6];
			}
		},
		d(detaching) {
			if (detaching) {
				detach(p);
				detach(t1);
				detach(label);
			}

			mounted = false;
			dispose();
		}
	};
}

// (40:8) {#if !geoSupported}
function create_if_block_14(ctx) {
	let p;

	return {
		c() {
			p = element("p");
			p.textContent = "Este navegador no tiene acceso al GPS.";
			attr(p, "class", "size-xs warn svelte-118nlww");
		},
		m(target, anchor) {
			insert(target, p, anchor);
		},
		p: noop,
		d(detaching) {
			if (detaching) {
				detach(p);
			}
		}
	};
}

// (84:4) {#if source !== 'file'}
function create_if_block_10(ctx) {
	let if_block_anchor;

	function select_block_type_3(ctx, dirty) {
		if (/*live*/ ctx[13]) return create_if_block_11;
		return create_else_block_2;
	}

	let current_block_type = select_block_type_3(ctx);
	let if_block = current_block_type(ctx);

	return {
		c() {
			if_block.c();
			if_block_anchor = empty();
		},
		m(target, anchor) {
			if_block.m(target, anchor);
			insert(target, if_block_anchor, anchor);
		},
		p(ctx, dirty) {
			if (current_block_type === (current_block_type = select_block_type_3(ctx)) && if_block) {
				if_block.p(ctx, dirty);
			} else {
				if_block.d(1);
				if_block = current_block_type(ctx);

				if (if_block) {
					if_block.c();
					if_block.m(if_block_anchor.parentNode, if_block_anchor);
				}
			}
		},
		d(detaching) {
			if (detaching) {
				detach(if_block_anchor);
			}

			if_block.d(detaching);
		}
	};
}

// (89:8) {:else}
function create_else_block_2(ctx) {
	let div;
	let mounted;
	let dispose;

	return {
		c() {
			div = element("div");
			div.textContent = "● Conectar en vivo";
			attr(div, "class", "button button--variant-orange size-s mb-10 svelte-118nlww");
			toggle_class(div, "disabled", /*source*/ ctx[0] === 'serial' && !/*serialSupported*/ ctx[22] || /*source*/ ctx[0] === 'gps' && !/*geoSupported*/ ctx[23]);
		},
		m(target, anchor) {
			insert(target, div, anchor);

			if (!mounted) {
				dispose = listen(div, "click", /*startLive*/ ctx[35]);
				mounted = true;
			}
		},
		p(ctx, dirty) {
			if (dirty[0] & /*source, serialSupported, geoSupported*/ 12582913) {
				toggle_class(div, "disabled", /*source*/ ctx[0] === 'serial' && !/*serialSupported*/ ctx[22] || /*source*/ ctx[0] === 'gps' && !/*geoSupported*/ ctx[23]);
			}
		},
		d(detaching) {
			if (detaching) {
				detach(div);
			}

			mounted = false;
			dispose();
		}
	};
}

// (85:8) {#if live}
function create_if_block_11(ctx) {
	let div;
	let mounted;
	let dispose;

	return {
		c() {
			div = element("div");
			div.textContent = "■ Desconectar";
			attr(div, "class", "button button--variant-red size-s mb-10");
		},
		m(target, anchor) {
			insert(target, div, anchor);

			if (!mounted) {
				dispose = listen(div, "click", /*stopLive*/ ctx[36]);
				mounted = true;
			}
		},
		p: noop,
		d(detaching) {
			if (detaching) {
				detach(div);
			}

			mounted = false;
			dispose();
		}
	};
}

// (101:4) {#if error}
function create_if_block_9(ctx) {
	let p;
	let t;

	return {
		c() {
			p = element("p");
			t = text(/*error*/ ctx[14]);
			attr(p, "class", "size-xs warn mb-10 svelte-118nlww");
		},
		m(target, anchor) {
			insert(target, p, anchor);
			append(p, t);
		},
		p(ctx, dirty) {
			if (dirty[0] & /*error*/ 16384) set_data(t, /*error*/ ctx[14]);
		},
		d(detaching) {
			if (detaching) {
				detach(p);
			}
		}
	};
}

// (105:4) {#if current}
function create_if_block_6(ctx) {
	let div7;
	let div6;
	let div0;
	let span0;
	let t1_value = /*fmtDeg*/ ctx[29](/*current*/ ctx[10].heading) + "";
	let t1;
	let t2;
	let div1;
	let span1;
	let t4_value = /*fmt*/ ctx[28](/*current*/ ctx[10].sog, 1) + "";
	let t4;
	let t5;
	let t6;
	let div2;
	let span2;
	let t8_value = /*fmtDeg*/ ctx[29](/*current*/ ctx[10].cog) + "";
	let t8;
	let t9;
	let div3;
	let span3;
	let t11_value = /*fmt*/ ctx[28](/*current*/ ctx[10].roll, 0) + "";
	let t11;
	let t12;
	let t13;
	let div4;
	let span4;
	let t15_value = /*fmt*/ ctx[28](/*current*/ ctx[10].pitch, 0) + "";
	let t15;
	let t16;
	let t17;
	let div5;
	let span5;

	let t19_value = (/*current*/ ctx[10].t
	? new Date(/*current*/ ctx[10].t).toLocaleTimeString()
	: '—') + "";

	let t19;
	let t20;
	let div8;

	function select_block_type_4(ctx, dirty) {
		if (/*windInfo*/ ctx[16]) return create_if_block_7;
		return create_else_block_1;
	}

	let current_block_type = select_block_type_4(ctx);
	let if_block = current_block_type(ctx);

	return {
		c() {
			div7 = element("div");
			div6 = element("div");
			div0 = element("div");
			span0 = element("span");
			span0.textContent = "Rumbo";
			t1 = text(t1_value);
			t2 = space();
			div1 = element("div");
			span1 = element("span");
			span1.textContent = "SOG";
			t4 = text(t4_value);
			t5 = text(" kn");
			t6 = space();
			div2 = element("div");
			span2 = element("span");
			span2.textContent = "COG";
			t8 = text(t8_value);
			t9 = space();
			div3 = element("div");
			span3 = element("span");
			span3.textContent = "Escora";
			t11 = text(t11_value);
			t12 = text("°");
			t13 = space();
			div4 = element("div");
			span4 = element("span");
			span4.textContent = "Cabeceo";
			t15 = text(t15_value);
			t16 = text("°");
			t17 = space();
			div5 = element("div");
			span5 = element("span");
			span5.textContent = "Hora";
			t19 = text(t19_value);
			t20 = space();
			div8 = element("div");
			if_block.c();
			attr(span0, "class", "lbl svelte-118nlww");
			attr(span1, "class", "lbl svelte-118nlww");
			attr(span2, "class", "lbl svelte-118nlww");
			attr(span3, "class", "lbl svelte-118nlww");
			attr(span4, "class", "lbl svelte-118nlww");
			attr(span5, "class", "lbl svelte-118nlww");
			attr(div6, "class", "grid svelte-118nlww");
			attr(div7, "class", "card mb-10 svelte-118nlww");
			attr(div8, "class", "card mb-10 wind svelte-118nlww");
		},
		m(target, anchor) {
			insert(target, div7, anchor);
			append(div7, div6);
			append(div6, div0);
			append(div0, span0);
			append(div0, t1);
			append(div6, t2);
			append(div6, div1);
			append(div1, span1);
			append(div1, t4);
			append(div1, t5);
			append(div6, t6);
			append(div6, div2);
			append(div2, span2);
			append(div2, t8);
			append(div6, t9);
			append(div6, div3);
			append(div3, span3);
			append(div3, t11);
			append(div3, t12);
			append(div6, t13);
			append(div6, div4);
			append(div4, span4);
			append(div4, t15);
			append(div4, t16);
			append(div6, t17);
			append(div6, div5);
			append(div5, span5);
			append(div5, t19);
			insert(target, t20, anchor);
			insert(target, div8, anchor);
			if_block.m(div8, null);
		},
		p(ctx, dirty) {
			if (dirty[0] & /*current*/ 1024 && t1_value !== (t1_value = /*fmtDeg*/ ctx[29](/*current*/ ctx[10].heading) + "")) set_data(t1, t1_value);
			if (dirty[0] & /*current*/ 1024 && t4_value !== (t4_value = /*fmt*/ ctx[28](/*current*/ ctx[10].sog, 1) + "")) set_data(t4, t4_value);
			if (dirty[0] & /*current*/ 1024 && t8_value !== (t8_value = /*fmtDeg*/ ctx[29](/*current*/ ctx[10].cog) + "")) set_data(t8, t8_value);
			if (dirty[0] & /*current*/ 1024 && t11_value !== (t11_value = /*fmt*/ ctx[28](/*current*/ ctx[10].roll, 0) + "")) set_data(t11, t11_value);
			if (dirty[0] & /*current*/ 1024 && t15_value !== (t15_value = /*fmt*/ ctx[28](/*current*/ ctx[10].pitch, 0) + "")) set_data(t15, t15_value);

			if (dirty[0] & /*current*/ 1024 && t19_value !== (t19_value = (/*current*/ ctx[10].t
			? new Date(/*current*/ ctx[10].t).toLocaleTimeString()
			: '—') + "")) set_data(t19, t19_value);

			if (current_block_type === (current_block_type = select_block_type_4(ctx)) && if_block) {
				if_block.p(ctx, dirty);
			} else {
				if_block.d(1);
				if_block = current_block_type(ctx);

				if (if_block) {
					if_block.c();
					if_block.m(div8, null);
				}
			}
		},
		d(detaching) {
			if (detaching) {
				detach(div7);
				detach(t20);
				detach(div8);
			}

			if_block.d();
		}
	};
}

// (136:12) {:else}
function create_else_block_1(ctx) {
	let span;
	let t;

	return {
		c() {
			span = element("span");
			t = text(/*windMsg*/ ctx[17]);
			attr(span, "class", "size-xs");
		},
		m(target, anchor) {
			insert(target, span, anchor);
			append(span, t);
		},
		p(ctx, dirty) {
			if (dirty[0] & /*windMsg*/ 131072) set_data(t, /*windMsg*/ ctx[17]);
		},
		d(detaching) {
			if (detaching) {
				detach(span);
			}
		}
	};
}

// (124:12) {#if windInfo}
function create_if_block_7(ctx) {
	let div2;
	let div0;
	let span0;
	let t1_value = /*windInfo*/ ctx[16].speed + "";
	let t1;
	let t2;
	let div1;
	let span1;
	let t4_value = Math.round(/*windInfo*/ ctx[16].dir) + "";
	let t4;
	let t5;
	let t6;
	let if_block = /*windInfo*/ ctx[16].twa !== null && create_if_block_8(ctx);

	return {
		c() {
			div2 = element("div");
			div0 = element("div");
			span0 = element("span");
			span0.textContent = "TWS";
			t1 = text(t1_value);
			t2 = space();
			div1 = element("div");
			span1 = element("span");
			span1.textContent = "TWD";
			t4 = text(t4_value);
			t5 = text("°");
			t6 = space();
			if (if_block) if_block.c();
			attr(span0, "class", "lbl svelte-118nlww");
			attr(span1, "class", "lbl svelte-118nlww");
			attr(div2, "class", "grid svelte-118nlww");
		},
		m(target, anchor) {
			insert(target, div2, anchor);
			append(div2, div0);
			append(div0, span0);
			append(div0, t1);
			append(div2, t2);
			append(div2, div1);
			append(div1, span1);
			append(div1, t4);
			append(div1, t5);
			append(div2, t6);
			if (if_block) if_block.m(div2, null);
		},
		p(ctx, dirty) {
			if (dirty[0] & /*windInfo*/ 65536 && t1_value !== (t1_value = /*windInfo*/ ctx[16].speed + "")) set_data(t1, t1_value);
			if (dirty[0] & /*windInfo*/ 65536 && t4_value !== (t4_value = Math.round(/*windInfo*/ ctx[16].dir) + "")) set_data(t4, t4_value);

			if (/*windInfo*/ ctx[16].twa !== null) {
				if (if_block) {
					if_block.p(ctx, dirty);
				} else {
					if_block = create_if_block_8(ctx);
					if_block.c();
					if_block.m(div2, null);
				}
			} else if (if_block) {
				if_block.d(1);
				if_block = null;
			}
		},
		d(detaching) {
			if (detaching) {
				detach(div2);
			}

			if (if_block) if_block.d();
		}
	};
}

// (128:20) {#if windInfo.twa !== null}
function create_if_block_8(ctx) {
	let div0;
	let span0;
	let t1_value = Math.abs(Math.round(/*windInfo*/ ctx[16].twa)) + "";
	let t1;
	let t2;
	let t3_value = (/*windInfo*/ ctx[16].twa >= 0 ? 'Er' : 'Br') + "";
	let t3;
	let t4;
	let div1;
	let span1;
	let t6_value = pointOfSail(/*windInfo*/ ctx[16].twa) + "";
	let t6;

	return {
		c() {
			div0 = element("div");
			span0 = element("span");
			span0.textContent = "TWA";
			t1 = text(t1_value);
			t2 = text("°\n                            ");
			t3 = text(t3_value);
			t4 = space();
			div1 = element("div");
			span1 = element("span");
			span1.textContent = "Rumbo vs viento";
			t6 = text(t6_value);
			attr(span0, "class", "lbl svelte-118nlww");
			attr(span1, "class", "lbl svelte-118nlww");
		},
		m(target, anchor) {
			insert(target, div0, anchor);
			append(div0, span0);
			append(div0, t1);
			append(div0, t2);
			append(div0, t3);
			insert(target, t4, anchor);
			insert(target, div1, anchor);
			append(div1, span1);
			append(div1, t6);
		},
		p(ctx, dirty) {
			if (dirty[0] & /*windInfo*/ 65536 && t1_value !== (t1_value = Math.abs(Math.round(/*windInfo*/ ctx[16].twa)) + "")) set_data(t1, t1_value);
			if (dirty[0] & /*windInfo*/ 65536 && t3_value !== (t3_value = (/*windInfo*/ ctx[16].twa >= 0 ? 'Er' : 'Br') + "")) set_data(t3, t3_value);
			if (dirty[0] & /*windInfo*/ 65536 && t6_value !== (t6_value = pointOfSail(/*windInfo*/ ctx[16].twa) + "")) set_data(t6, t6_value);
		},
		d(detaching) {
			if (detaching) {
				detach(div0);
				detach(t4);
				detach(div1);
			}
		}
	};
}

// (142:4) {#if points.length > 1 && !live}
function create_if_block_5(ctx) {
	let div3;
	let input;
	let input_max_value;
	let t0;
	let div2;
	let div0;
	let t1_value = (/*playing*/ ctx[15] ? '❚❚' : '▶') + "";
	let t1;
	let t2;
	let span;
	let t3_value = /*index*/ ctx[9] + 1 + "";
	let t3;
	let t4;
	let t5_value = /*points*/ ctx[8].length + "";
	let t5;
	let t6;
	let div1;
	let mounted;
	let dispose;

	return {
		c() {
			div3 = element("div");
			input = element("input");
			t0 = space();
			div2 = element("div");
			div0 = element("div");
			t1 = text(t1_value);
			t2 = space();
			span = element("span");
			t3 = text(t3_value);
			t4 = text(" / ");
			t5 = text(t5_value);
			t6 = space();
			div1 = element("div");
			div1.textContent = "Encuadrar";
			attr(input, "class", "slider svelte-118nlww");
			attr(input, "type", "range");
			attr(input, "min", "0");
			attr(input, "max", input_max_value = /*points*/ ctx[8].length - 1);
			attr(div0, "class", "button size-xs");
			attr(span, "class", "size-xs");
			attr(div1, "class", "button size-xs");
			attr(div2, "class", "row svelte-118nlww");
			attr(div3, "class", "mb-10");
		},
		m(target, anchor) {
			insert(target, div3, anchor);
			append(div3, input);
			set_input_value(input, /*index*/ ctx[9]);
			append(div3, t0);
			append(div3, div2);
			append(div2, div0);
			append(div0, t1);
			append(div2, t2);
			append(div2, span);
			append(span, t3);
			append(span, t4);
			append(span, t5);
			append(div2, t6);
			append(div2, div1);

			if (!mounted) {
				dispose = [
					listen(input, "change", /*input_change_input_handler*/ ctx[48]),
					listen(input, "input", /*input_change_input_handler*/ ctx[48]),
					listen(input, "change", /*change_handler*/ ctx[49]),
					listen(div0, "click", /*togglePlay*/ ctx[33]),
					listen(div1, "click", /*fitTrack*/ ctx[31])
				];

				mounted = true;
			}
		},
		p(ctx, dirty) {
			if (dirty[0] & /*points*/ 256 && input_max_value !== (input_max_value = /*points*/ ctx[8].length - 1)) {
				attr(input, "max", input_max_value);
			}

			if (dirty[0] & /*index*/ 512) {
				set_input_value(input, /*index*/ ctx[9]);
			}

			if (dirty[0] & /*playing*/ 32768 && t1_value !== (t1_value = (/*playing*/ ctx[15] ? '❚❚' : '▶') + "")) set_data(t1, t1_value);
			if (dirty[0] & /*index*/ 512 && t3_value !== (t3_value = /*index*/ ctx[9] + 1 + "")) set_data(t3, t3_value);
			if (dirty[0] & /*points*/ 256 && t5_value !== (t5_value = /*points*/ ctx[8].length + "")) set_data(t5, t5_value);
		},
		d(detaching) {
			if (detaching) {
				detach(div3);
			}

			mounted = false;
			run_all(dispose);
		}
	};
}

// (161:4) {#if points.length > 1}
function create_if_block_3(ctx) {
	let div;
	let t0_value = /*stats*/ ctx[18].distance.toFixed(1) + "";
	let t0;
	let t1;
	let t2;
	let t3_value = /*stats*/ ctx[18].maxSog.toFixed(1) + "";
	let t3;
	let t4;
	let if_block = /*stats*/ ctx[18].duration && create_if_block_4(ctx);

	return {
		c() {
			div = element("div");
			t0 = text(t0_value);
			t1 = text(" NM\n            ");
			if (if_block) if_block.c();
			t2 = text("\n            · máx ");
			t3 = text(t3_value);
			t4 = text(" kn");
			attr(div, "class", "size-xs mb-10 stats svelte-118nlww");
		},
		m(target, anchor) {
			insert(target, div, anchor);
			append(div, t0);
			append(div, t1);
			if (if_block) if_block.m(div, null);
			append(div, t2);
			append(div, t3);
			append(div, t4);
		},
		p(ctx, dirty) {
			if (dirty[0] & /*stats*/ 262144 && t0_value !== (t0_value = /*stats*/ ctx[18].distance.toFixed(1) + "")) set_data(t0, t0_value);

			if (/*stats*/ ctx[18].duration) {
				if (if_block) {
					if_block.p(ctx, dirty);
				} else {
					if_block = create_if_block_4(ctx);
					if_block.c();
					if_block.m(div, t2);
				}
			} else if (if_block) {
				if_block.d(1);
				if_block = null;
			}

			if (dirty[0] & /*stats*/ 262144 && t3_value !== (t3_value = /*stats*/ ctx[18].maxSog.toFixed(1) + "")) set_data(t3, t3_value);
		},
		d(detaching) {
			if (detaching) {
				detach(div);
			}

			if (if_block) if_block.d();
		}
	};
}

// (164:12) {#if stats.duration}
function create_if_block_4(ctx) {
	let t0;
	let t1_value = /*fmtDuration*/ ctx[30](/*stats*/ ctx[18].duration) + "";
	let t1;

	return {
		c() {
			t0 = text("· ");
			t1 = text(t1_value);
		},
		m(target, anchor) {
			insert(target, t0, anchor);
			insert(target, t1, anchor);
		},
		p(ctx, dirty) {
			if (dirty[0] & /*stats*/ 262144 && t1_value !== (t1_value = /*fmtDuration*/ ctx[30](/*stats*/ ctx[18].duration) + "")) set_data(t1, t1_value);
		},
		d(detaching) {
			if (detaching) {
				detach(t0);
				detach(t1);
			}
		}
	};
}

// (177:4) {#if points.length}
function create_if_block_2(ctx) {
	let div;
	let mounted;
	let dispose;

	return {
		c() {
			div = element("div");
			div.textContent = "Borrar track";
			attr(div, "class", "button size-xs mt-10");
		},
		m(target, anchor) {
			insert(target, div, anchor);

			if (!mounted) {
				dispose = listen(div, "click", /*clearTrack*/ ctx[37]);
				mounted = true;
			}
		},
		p: noop,
		d(detaching) {
			if (detaching) {
				detach(div);
			}

			mounted = false;
			dispose();
		}
	};
}

// (198:8) {:else}
function create_else_block(ctx) {
	let label;
	let t0;
	let input0;
	let t1;
	let div0;
	let t3;
	let div2;
	let input1;
	let t4;
	let div1;
	let mounted;
	let dispose;

	return {
		c() {
			label = element("label");
			t0 = text("Cargar ruta (GPX, CSV, NMEA, JSON)\n                ");
			input0 = element("input");
			t1 = space();
			div0 = element("div");
			div0.textContent = "o pega un enlace al archivo:";
			t3 = space();
			div2 = element("div");
			input1 = element("input");
			t4 = space();
			div1 = element("div");
			div1.textContent = "Cargar";
			attr(input0, "type", "file");
			attr(input0, "class", "svelte-118nlww");
			attr(label, "class", "button size-xs file-btn svelte-118nlww");
			attr(div0, "class", "size-xs hint mt-5 mb-5 svelte-118nlww");
			attr(input1, "class", "url-input svelte-118nlww");
			attr(input1, "type", "text");
			attr(input1, "placeholder", "https://…/ruta.gpx");
			attr(div1, "class", "button size-xs");
			attr(div2, "class", "row svelte-118nlww");
		},
		m(target, anchor) {
			insert(target, label, anchor);
			append(label, t0);
			append(label, input0);
			insert(target, t1, anchor);
			insert(target, div0, anchor);
			insert(target, t3, anchor);
			insert(target, div2, anchor);
			append(div2, input1);
			set_input_value(input1, /*refUrl*/ ctx[12]);
			append(div2, t4);
			append(div2, div1);

			if (!mounted) {
				dispose = [
					listen(input0, "change", /*onRefFile*/ ctx[26]),
					listen(input1, "input", /*input1_input_handler*/ ctx[52]),
					listen(div1, "click", /*loadRefUrl*/ ctx[27])
				];

				mounted = true;
			}
		},
		p(ctx, dirty) {
			if (dirty[0] & /*refUrl*/ 4096 && input1.value !== /*refUrl*/ ctx[12]) {
				set_input_value(input1, /*refUrl*/ ctx[12]);
			}
		},
		d(detaching) {
			if (detaching) {
				detach(label);
				detach(t1);
				detach(div0);
				detach(t3);
				detach(div2);
			}

			mounted = false;
			run_all(dispose);
		}
	};
}

// (184:8) {#if refPoints.length}
function create_if_block(ctx) {
	let div0;
	let span;
	let t0;
	let t1;
	let t2;
	let t3_value = /*refDistance*/ ctx[20].toFixed(1) + "";
	let t3;
	let t4;
	let t5;
	let t6;
	let div3;
	let div1;
	let t8;
	let div2;
	let mounted;
	let dispose;
	let if_block = /*current*/ ctx[10] && /*refInfo*/ ctx[19] && create_if_block_1(ctx);

	return {
		c() {
			div0 = element("div");
			span = element("span");
			t0 = space();
			t1 = text(/*refName*/ ctx[11]);
			t2 = text(" · ");
			t3 = text(t3_value);
			t4 = text(" NM");
			t5 = space();
			if (if_block) if_block.c();
			t6 = space();
			div3 = element("div");
			div1 = element("div");
			div1.textContent = "Encuadrar";
			t8 = space();
			div2 = element("div");
			div2.textContent = "Quitar";
			attr(span, "class", "ref-swatch svelte-118nlww");
			attr(div0, "class", "size-xs mb-5");
			attr(div1, "class", "button size-xs");
			attr(div2, "class", "button size-xs");
			attr(div3, "class", "row svelte-118nlww");
		},
		m(target, anchor) {
			insert(target, div0, anchor);
			append(div0, span);
			append(div0, t0);
			append(div0, t1);
			append(div0, t2);
			append(div0, t3);
			append(div0, t4);
			insert(target, t5, anchor);
			if (if_block) if_block.m(target, anchor);
			insert(target, t6, anchor);
			insert(target, div3, anchor);
			append(div3, div1);
			append(div3, t8);
			append(div3, div2);

			if (!mounted) {
				dispose = [
					listen(div1, "click", /*fitRef*/ ctx[24]),
					listen(div2, "click", /*clearRef*/ ctx[25])
				];

				mounted = true;
			}
		},
		p(ctx, dirty) {
			if (dirty[0] & /*refName*/ 2048) set_data(t1, /*refName*/ ctx[11]);
			if (dirty[0] & /*refDistance*/ 1048576 && t3_value !== (t3_value = /*refDistance*/ ctx[20].toFixed(1) + "")) set_data(t3, t3_value);

			if (/*current*/ ctx[10] && /*refInfo*/ ctx[19]) {
				if (if_block) {
					if_block.p(ctx, dirty);
				} else {
					if_block = create_if_block_1(ctx);
					if_block.c();
					if_block.m(t6.parentNode, t6);
				}
			} else if (if_block) {
				if_block.d(1);
				if_block = null;
			}
		},
		d(detaching) {
			if (detaching) {
				detach(div0);
				detach(t5);
				detach(t6);
				detach(div3);
			}

			if (if_block) if_block.d(detaching);
			mounted = false;
			run_all(dispose);
		}
	};
}

// (189:12) {#if current && refInfo}
function create_if_block_1(ctx) {
	let div;
	let t0;
	let t1_value = /*refInfo*/ ctx[19].xte.toFixed(2) + "";
	let t1;
	let t2;
	let t3_value = /*refInfo*/ ctx[19].remaining.toFixed(1) + "";
	let t3;
	let t4;

	return {
		c() {
			div = element("div");
			t0 = text("Desvío ");
			t1 = text(t1_value);
			t2 = text(" NM · Faltan ");
			t3 = text(t3_value);
			t4 = text(" NM");
			attr(div, "class", "size-xs mb-5");
		},
		m(target, anchor) {
			insert(target, div, anchor);
			append(div, t0);
			append(div, t1);
			append(div, t2);
			append(div, t3);
			append(div, t4);
		},
		p(ctx, dirty) {
			if (dirty[0] & /*refInfo*/ 524288 && t1_value !== (t1_value = /*refInfo*/ ctx[19].xte.toFixed(2) + "")) set_data(t1, t1_value);
			if (dirty[0] & /*refInfo*/ 524288 && t3_value !== (t3_value = /*refInfo*/ ctx[19].remaining.toFixed(1) + "")) set_data(t3, t3_value);
		},
		d(detaching) {
			if (detaching) {
				detach(div);
			}
		}
	};
}

function create_fragment(ctx) {
	let div0;
	let t1;
	let section;
	let t2;
	let div5;
	let div1;
	let t4;
	let div2;
	let t6;
	let div3;
	let t8;
	let div4;
	let t10;
	let t11;
	let t12;
	let t13;
	let t14;
	let t15;
	let t16;
	let label0;
	let input0;
	let t17;
	let t18;
	let label1;
	let input1;
	let t19;
	let t20;
	let t21;
	let div7;
	let div6;
	let t23;
	let mounted;
	let dispose;
	let if_block0 = !isMobileOrTablet && create_if_block_17(ctx);

	function select_block_type(ctx, dirty) {
		if (/*source*/ ctx[0] === 'file') return create_if_block_12;
		if (/*source*/ ctx[0] === 'gps') return create_if_block_13;
		if (/*source*/ ctx[0] === 'serial') return create_if_block_15;
		return create_else_block_5;
	}

	let current_block_type = select_block_type(ctx);
	let if_block1 = current_block_type(ctx);
	let if_block2 = /*source*/ ctx[0] !== 'file' && create_if_block_10(ctx);
	let if_block3 = /*error*/ ctx[14] && create_if_block_9(ctx);
	let if_block4 = /*current*/ ctx[10] && create_if_block_6(ctx);
	let if_block5 = /*points*/ ctx[8].length > 1 && !/*live*/ ctx[13] && create_if_block_5(ctx);
	let if_block6 = /*points*/ ctx[8].length > 1 && create_if_block_3(ctx);
	let if_block7 = /*points*/ ctx[8].length && create_if_block_2(ctx);

	function select_block_type_5(ctx, dirty) {
		if (/*refPoints*/ ctx[7].length) return create_if_block;
		return create_else_block;
	}

	let current_block_type_1 = select_block_type_5(ctx);
	let if_block8 = current_block_type_1(ctx);

	return {
		c() {
			div0 = element("div");
			div0.textContent = `${/*title*/ ctx[21]}`;
			t1 = space();
			section = element("section");
			if (if_block0) if_block0.c();
			t2 = space();
			div5 = element("div");
			div1 = element("div");
			div1.textContent = "Archivo";
			t4 = space();
			div2 = element("div");
			div2.textContent = "GPS tablet";
			t6 = space();
			div3 = element("div");
			div3.textContent = "USB";
			t8 = space();
			div4 = element("div");
			div4.textContent = "Wi‑Fi / URL";
			t10 = space();
			if_block1.c();
			t11 = space();
			if (if_block2) if_block2.c();
			t12 = space();
			if (if_block3) if_block3.c();
			t13 = space();
			if (if_block4) if_block4.c();
			t14 = space();
			if (if_block5) if_block5.c();
			t15 = space();
			if (if_block6) if_block6.c();
			t16 = space();
			label0 = element("label");
			input0 = element("input");
			t17 = text("\n        Sincronizar hora del pronóstico con el track");
			t18 = space();
			label1 = element("label");
			input1 = element("input");
			t19 = text("\n        Seguir al barco");
			t20 = space();
			if (if_block7) if_block7.c();
			t21 = space();
			div7 = element("div");
			div6 = element("div");
			div6.textContent = "Ruta de referencia";
			t23 = space();
			if_block8.c();
			attr(div0, "class", "plugin__mobile-header");
			attr(div1, "class", "tab clickable svelte-118nlww");
			toggle_class(div1, "active", /*source*/ ctx[0] === 'file');
			attr(div2, "class", "tab clickable svelte-118nlww");
			toggle_class(div2, "active", /*source*/ ctx[0] === 'gps');
			attr(div3, "class", "tab clickable svelte-118nlww");
			toggle_class(div3, "active", /*source*/ ctx[0] === 'serial');
			attr(div4, "class", "tab clickable svelte-118nlww");
			toggle_class(div4, "active", /*source*/ ctx[0] === 'http');
			attr(div5, "class", "tabs mb-10 svelte-118nlww");
			attr(input0, "type", "checkbox");
			attr(label0, "class", "size-xs check svelte-118nlww");
			attr(input1, "type", "checkbox");
			attr(label1, "class", "size-xs check svelte-118nlww");
			attr(div6, "class", "size-xs lbl svelte-118nlww");
			attr(div7, "class", "ref mt-15 svelte-118nlww");
			attr(section, "class", "plugin__content itrip svelte-118nlww");
		},
		m(target, anchor) {
			insert(target, div0, anchor);
			insert(target, t1, anchor);
			insert(target, section, anchor);
			if (if_block0) if_block0.m(section, null);
			append(section, t2);
			append(section, div5);
			append(div5, div1);
			append(div5, t4);
			append(div5, div2);
			append(div5, t6);
			append(div5, div3);
			append(div5, t8);
			append(div5, div4);
			append(section, t10);
			if_block1.m(section, null);
			append(section, t11);
			if (if_block2) if_block2.m(section, null);
			append(section, t12);
			if (if_block3) if_block3.m(section, null);
			append(section, t13);
			if (if_block4) if_block4.m(section, null);
			append(section, t14);
			if (if_block5) if_block5.m(section, null);
			append(section, t15);
			if (if_block6) if_block6.m(section, null);
			append(section, t16);
			append(section, label0);
			append(label0, input0);
			input0.checked = /*syncTime*/ ctx[4];
			append(label0, t17);
			append(section, t18);
			append(section, label1);
			append(label1, input1);
			input1.checked = /*follow*/ ctx[5];
			append(label1, t19);
			append(section, t20);
			if (if_block7) if_block7.m(section, null);
			append(section, t21);
			append(section, div7);
			append(div7, div6);
			append(div7, t23);
			if_block8.m(div7, null);

			if (!mounted) {
				dispose = [
					listen(div1, "click", /*click_handler_1*/ ctx[40]),
					listen(div2, "click", /*click_handler_2*/ ctx[41]),
					listen(div3, "click", /*click_handler_3*/ ctx[42]),
					listen(div4, "click", /*click_handler_4*/ ctx[43]),
					listen(input0, "change", /*input0_change_handler*/ ctx[50]),
					listen(input1, "change", /*input1_change_handler*/ ctx[51])
				];

				mounted = true;
			}
		},
		p(ctx, dirty) {
			if (!isMobileOrTablet) if_block0.p(ctx, dirty);

			if (dirty[0] & /*source*/ 1) {
				toggle_class(div1, "active", /*source*/ ctx[0] === 'file');
			}

			if (dirty[0] & /*source*/ 1) {
				toggle_class(div2, "active", /*source*/ ctx[0] === 'gps');
			}

			if (dirty[0] & /*source*/ 1) {
				toggle_class(div3, "active", /*source*/ ctx[0] === 'serial');
			}

			if (dirty[0] & /*source*/ 1) {
				toggle_class(div4, "active", /*source*/ ctx[0] === 'http');
			}

			if (current_block_type === (current_block_type = select_block_type(ctx)) && if_block1) {
				if_block1.p(ctx, dirty);
			} else {
				if_block1.d(1);
				if_block1 = current_block_type(ctx);

				if (if_block1) {
					if_block1.c();
					if_block1.m(section, t11);
				}
			}

			if (/*source*/ ctx[0] !== 'file') {
				if (if_block2) {
					if_block2.p(ctx, dirty);
				} else {
					if_block2 = create_if_block_10(ctx);
					if_block2.c();
					if_block2.m(section, t12);
				}
			} else if (if_block2) {
				if_block2.d(1);
				if_block2 = null;
			}

			if (/*error*/ ctx[14]) {
				if (if_block3) {
					if_block3.p(ctx, dirty);
				} else {
					if_block3 = create_if_block_9(ctx);
					if_block3.c();
					if_block3.m(section, t13);
				}
			} else if (if_block3) {
				if_block3.d(1);
				if_block3 = null;
			}

			if (/*current*/ ctx[10]) {
				if (if_block4) {
					if_block4.p(ctx, dirty);
				} else {
					if_block4 = create_if_block_6(ctx);
					if_block4.c();
					if_block4.m(section, t14);
				}
			} else if (if_block4) {
				if_block4.d(1);
				if_block4 = null;
			}

			if (/*points*/ ctx[8].length > 1 && !/*live*/ ctx[13]) {
				if (if_block5) {
					if_block5.p(ctx, dirty);
				} else {
					if_block5 = create_if_block_5(ctx);
					if_block5.c();
					if_block5.m(section, t15);
				}
			} else if (if_block5) {
				if_block5.d(1);
				if_block5 = null;
			}

			if (/*points*/ ctx[8].length > 1) {
				if (if_block6) {
					if_block6.p(ctx, dirty);
				} else {
					if_block6 = create_if_block_3(ctx);
					if_block6.c();
					if_block6.m(section, t16);
				}
			} else if (if_block6) {
				if_block6.d(1);
				if_block6 = null;
			}

			if (dirty[0] & /*syncTime*/ 16) {
				input0.checked = /*syncTime*/ ctx[4];
			}

			if (dirty[0] & /*follow*/ 32) {
				input1.checked = /*follow*/ ctx[5];
			}

			if (/*points*/ ctx[8].length) {
				if (if_block7) {
					if_block7.p(ctx, dirty);
				} else {
					if_block7 = create_if_block_2(ctx);
					if_block7.c();
					if_block7.m(section, t21);
				}
			} else if (if_block7) {
				if_block7.d(1);
				if_block7 = null;
			}

			if (current_block_type_1 === (current_block_type_1 = select_block_type_5(ctx)) && if_block8) {
				if_block8.p(ctx, dirty);
			} else {
				if_block8.d(1);
				if_block8 = current_block_type_1(ctx);

				if (if_block8) {
					if_block8.c();
					if_block8.m(div7, null);
				}
			}
		},
		i: noop,
		o: noop,
		d(detaching) {
			if (detaching) {
				detach(div0);
				detach(t1);
				detach(section);
			}

			if (if_block0) if_block0.d();
			if_block1.d();
			if (if_block2) if_block2.d();
			if (if_block3) if_block3.d();
			if (if_block4) if_block4.d();
			if (if_block5) if_block5.d();
			if (if_block6) if_block6.d();
			if (if_block7) if_block7.d();
			if_block8.d();
			mounted = false;
			run_all(dispose);
		}
	};
}

const SETTINGS_KEY = 'windy-plugin-itrip-settings';
const REF_KEY = 'windy-plugin-itrip-ref';

function instance($$self, $$props, $$invalidate) {
	let refDistance;
	let refInfo;
	let current;
	let stats;
	const { title } = config;
	const serialSupported = isSerialSupported();
	const geoSupported = isGeolocationSupported();

	const loadSettings = () => {
		try {
			return JSON.parse(localStorage.getItem(SETTINGS_KEY) || '{}');
		} catch {
			return {};
		}
	};

	const saved = loadSettings();
	let source = saved.source || 'file';
	let baudRate = saved.baudRate || 9600;
	let httpUrl = saved.httpUrl || '';
	let pollSeconds = saved.pollSeconds || 2;
	let syncTime = saved.syncTime !== false;
	let follow = saved.follow !== false;
	let useCompass = saved.useCompass === true;
	let refPoints = [];
	let refName = '';
	let refLine = null;

	function drawRef() {
		refLine?.remove();
		refLine = null;

		if (refPoints.length > 1) {
			refLine = new L.Polyline(refPoints,
			{
					color: '#00e5ff',
					weight: 2.5,
					opacity: 0.9,
					dashArray: '8 6'
				}).addTo(map);
		}
	}

	function fitRef() {
		if (refLine) {
			map.fitBounds(refLine.getBounds(), { padding: 40 });
		}
	}

	function clearRef() {
		$$invalidate(7, refPoints = []);
		$$invalidate(11, refName = '');
		refLine?.remove();
		refLine = null;

		try {
			localStorage.removeItem(REF_KEY);
		} catch {
			
		}
	}

	let refUrl = '';

	function setRef(name, text) {
		const pts = parseFile(name, text);

		if (pts.length < 2) {
			$$invalidate(14, error = 'La ruta necesita al menos 2 posiciones.');
			return;
		}

		$$invalidate(7, refPoints = pts.map(p => [p.lat, p.lon]));
		$$invalidate(11, refName = decodeURIComponent(name.split('/').pop() || 'Ruta').replace(/\.[^.]+$/, ''));
		drawRef();
		fitRef();

		try {
			localStorage.setItem(REF_KEY, JSON.stringify({ name: refName, points: refPoints }));
		} catch {
			
		}
	}

	async function onRefFile(e) {
		const input = e.target;
		const file = input.files?.[0];

		if (!file) {
			return;
		}

		$$invalidate(14, error = '');

		try {
			setRef(file.name, await file.text());
		} catch(err) {
			$$invalidate(14, error = `Error leyendo la ruta: ${err.message}`);
		} finally {
			input.value = '';
		}
	}

	async function loadRefUrl() {
		$$invalidate(14, error = '');
		const url = refUrl.trim();

		if (!(/^https:\/\//).test(url)) {
			$$invalidate(14, error = 'El enlace debe empezar por https://');
			return;
		}

		try {
			const res = await fetch(url);

			if (!res.ok) {
				throw new Error(`HTTP ${res.status}`);
			}

			setRef(url.split('?')[0], await res.text());
		} catch(err) {
			$$invalidate(14, error = `No se pudo descargar la ruta: ${err.message}`);
		}
	}

	function restoreRef() {
		try {
			const data = JSON.parse(localStorage.getItem(REF_KEY) || 'null');

			if (data && Array.isArray(data.points)) {
				$$invalidate(7, refPoints = data.points);
				$$invalidate(11, refName = data.name || 'Ruta');
				drawRef();
			}
		} catch {
			
		}
	}

	let nowTimer = null;
	let wakeLock = null;

	const setForecastNow = () => {
		if (syncTime) {
			store.set('timestamp', Date.now());
		}
	};

	async function keepScreenOn() {
		try {
			const nav = navigator;
			wakeLock = await nav.wakeLock?.request('screen') ?? null;
		} catch {
			wakeLock = null;
		}
	}

	let points = [];
	let index = 0;
	let live = null;
	let liveAttitude = {};
	let error = '';
	let playing = false;
	let playTimer = null;
	let windInfo = null;
	let windMsg = 'Calculando viento…';
	let trackShadow = null;
	let trackLine = null;
	let doneLine = null;
	let marker = null;

	const fmt = (v, d) => v === undefined || !Number.isFinite(v)
	? '—'
	: v.toFixed(d);

	const fmtDeg = v => v === undefined ? '—' : `${Math.round(norm360(v))}°`;

	const fmtDuration = ms => {
		const m = Math.round(ms / 60000);

		return m < 60
		? `${m} min`
		: `${Math.floor(m / 60)} h ${m % 60} min`;
	};

	function computeStats(pts) {
		let distance = 0;
		let maxSog = 0;

		for (let i = 1; i < pts.length; i++) {
			distance += distanceNm(pts[i - 1].lat, pts[i - 1].lon, pts[i].lat, pts[i].lon);
		}

		for (const p of pts) {
			if (p.sog !== undefined && p.sog > maxSog) {
				maxSog = p.sog;
			}
		}

		const first = pts[0]?.t;
		const last = pts[pts.length - 1]?.t;

		return {
			distance,
			maxSog,
			duration: first !== undefined && last !== undefined
			? last - first
			: 0
		};
	}

	function enrich(pts) {
		for (let i = 1; i < pts.length; i++) {
			const a = pts[i - 1];
			const b = pts[i];

			if (b.cog === undefined) {
				b.cog = bearing(a.lat, a.lon, b.lat, b.lon);
			}

			if (b.sog === undefined && a.t !== undefined && b.t !== undefined && b.t > a.t) {
				b.sog = distanceNm(a.lat, a.lon, b.lat, b.lon) / ((b.t - a.t) / 3600000);
			}
		}

		if (pts.length > 1 && pts[0].cog === undefined) {
			pts[0].cog = pts[1].cog;
		}

		return pts;
	}

	const headingOf = p => p.heading ?? p.cog;

	function drawTrack() {
		const latlngs = points.map(p => [p.lat, p.lon]);

		if (!trackLine) {
			trackShadow = new L.Polyline(latlngs, { color: '#000', weight: 5, opacity: 0.45 }).addTo(map);
			trackLine = new L.Polyline(latlngs, { color: '#fff', weight: 2, opacity: 0.9 }).addTo(map);
			doneLine = new L.Polyline([], { color: '#ff2d6f', weight: 3, opacity: 1 }).addTo(map);
		} else {
			trackShadow?.setLatLngs(latlngs);
			trackLine.setLatLngs(latlngs);
		}
	}

	function updateBoat(p) {
		if (!marker) {
			marker = new L.Marker([p.lat, p.lon], { icon: createBoatIcon() }).addTo(map);
		} else {
			marker.setLatLng([p.lat, p.lon]);
		}

		setBoatRotation(marker, headingOf(p));
		doneLine?.setLatLngs(points.slice(0, index + 1).map(q => [q.lat, q.lon]));

		if (follow) {
			map.panTo([p.lat, p.lon]);
		}

		updateWind();
	}

	function fitTrack() {
		if (trackLine && points.length > 1) {
			map.fitBounds(trackLine.getBounds(), { padding: 40 });
		}
	}

	function removeMapFeatures() {
		trackShadow?.remove();
		trackLine?.remove();
		doneLine?.remove();
		marker?.remove();
		trackShadow = trackLine = doneLine = null;
		marker = null;
	}

	let windRequest = 0;

	async function updateWind() {
		const p = current;

		if (!p) {
			return;
		}

		const req = ++windRequest;

		if (store.get('overlay') !== 'wind') {
			$$invalidate(16, windInfo = null);
			$$invalidate(17, windMsg = 'Activa la capa de viento para ver TWS / TWA.');
			setWindArrow(marker, null);
			return;
		}

		const interpolate = await getLatLonInterpolator();

		if (req !== windRequest) {
			return;
		}

		const values = interpolate?.({ lat: p.lat, lon: p.lon });

		if (!Array.isArray(values)) {
			$$invalidate(16, windInfo = null);
			$$invalidate(17, windMsg = 'Sin datos de viento en esta posición.');
			setWindArrow(marker, null);
			return;
		}

		const { dir, wind } = wind2obj(values);
		const hdg = headingOf(p);

		$$invalidate(16, windInfo = {
			speed: metrics.wind.convertValue(wind),
			dir,
			twa: hdg === undefined ? null : trueWindAngle(dir, hdg)
		});

		setWindArrow(marker, dir);
	}

	let lastTsSet = 0;

	function syncTimestamp(force = false) {
		const t = current?.t;

		if (!syncTime || t === undefined || live) {
			return;
		}

		const now = Date.now();

		if (!force && now - lastTsSet < 1500) {
			return;
		}

		lastTsSet = now;

		try {
			store.set('timestamp', t);
		} catch(e) {
			console.warn('iTrip: timestamp fuera del rango del pronóstico', e);
		}
	}

	function togglePlay() {
		if (playing) {
			stopPlay();
			return;
		}

		if (index >= points.length - 1) {
			$$invalidate(9, index = 0);
		}

		$$invalidate(15, playing = true);
		const step = Math.max(1, Math.round(points.length / 600));

		playTimer = setInterval(
			() => {
				if (index >= points.length - 1) {
					stopPlay();
					syncTimestamp(true);
					return;
				}

				$$invalidate(9, index = Math.min(points.length - 1, index + step));
				syncTimestamp();
			},
			150
		);
	}

	function stopPlay() {
		$$invalidate(15, playing = false);

		if (playTimer) {
			clearInterval(playTimer);
			playTimer = null;
		}
	}

	function setTrack(pts) {
		stopPlay();
		$$invalidate(8, points = enrich(pts));
		$$invalidate(9, index = 0);
		drawTrack();
		fitTrack();
		syncTimestamp(true);
	}

	async function onFile(e) {
		const input = e.target;
		const file = input.files?.[0];

		if (!file) {
			return;
		}

		$$invalidate(14, error = '');

		try {
			const pts = parseFile(file.name, await file.text());

			if (!pts.length) {
				$$invalidate(14, error = 'No se han encontrado posiciones válidas en el archivo.');
				return;
			}

			const wasFollow = follow;
			$$invalidate(5, follow = false);
			setTrack(pts);
			$$invalidate(5, follow = wasFollow);
		} catch(err) {
			$$invalidate(14, error = `Error leyendo el archivo: ${err.message}`);
		} finally {
			input.value = '';
		}
	}

	function onLivePoint(p, hasPosition) {
		if (!hasPosition) {
			liveAttitude = { ...liveAttitude, ...p };
			const last = points[points.length - 1];

			if (last) {
				Object.assign(last, p);
				$$invalidate(8, points);
			}

			return;
		}

		const pt = {
			...liveAttitude,
			...p,
			t: p.t ?? Date.now()
		};

		const prev = points[points.length - 1];

		if (prev && prev.lat === pt.lat && prev.lon === pt.lon && pt.heading === prev.heading) {
			return;
		}

		points.push(pt);
		enrich(points.slice(-2));
		$$invalidate(8, points);
		$$invalidate(9, index = points.length - 1);
		drawTrack();
	}

	async function startLive() {
		$$invalidate(14, error = '');
		stopPlay();
		clearTrack();
		liveAttitude = {};

		try {
			if (source === 'gps') {
				$$invalidate(13, live = await startGeolocation(useCompass, onLivePoint, msg => {
					$$invalidate(14, error = msg);
				}));
			} else if (source === 'serial') {
				$$invalidate(13, live = await startSerial(Number(baudRate), onLivePoint));
			} else {
				if (!(/^https?:\/\//).test(httpUrl)) {
					$$invalidate(14, error = 'Introduce una URL válida (https://…).');
					return;
				}

				$$invalidate(13, live = startHttpPolling(httpUrl, Number(pollSeconds) * 1000, onLivePoint, msg => {
					$$invalidate(14, error = msg);
				}));
			}

			setForecastNow();
			nowTimer = setInterval(setForecastNow, 5 * 60 * 1000);
			keepScreenOn();
		} catch(err) {
			$$invalidate(14, error = `No se pudo conectar: ${err.message}`);
			$$invalidate(13, live = null);
		}
	}

	async function stopLive() {
		const l = live;
		$$invalidate(13, live = null);

		if (nowTimer) {
			clearInterval(nowTimer);
			nowTimer = null;
		}

		wakeLock?.release().catch(() => {
			
		});

		wakeLock = null;
		await l?.stop();
	}

	const onVisibility = () => {
		if (live && document.visibilityState === 'visible') {
			keepScreenOn();
			setForecastNow();
		}
	};

	function clearTrack() {
		stopPlay();
		$$invalidate(8, points = []);
		$$invalidate(9, index = 0);
		$$invalidate(16, windInfo = null);
		removeMapFeatures();
	}

	const onRedraw = () => updateWind();
	const onOverlay = () => updateWind();

	const onopen = _params => {
		if (store.get('overlay') !== 'wind') {
			store.set('overlay', 'wind');
		}
	};

	onMount(() => {
		bcast.on('redrawFinished', onRedraw);
		store.on('overlay', onOverlay);
		document.addEventListener('visibilitychange', onVisibility);
		restoreRef();
	});

	onDestroy(() => {
		stopPlay();
		stopLive();
		bcast.off('redrawFinished', onRedraw);
		store.off('overlay', onOverlay);
		document.removeEventListener('visibilitychange', onVisibility);
		removeMapFeatures();
		refLine?.remove();
		refLine = null;
	});

	const click_handler = () => bcast.emit('rqstOpen', 'menu');
	const click_handler_1 = () => $$invalidate(0, source = 'file');
	const click_handler_2 = () => $$invalidate(0, source = 'gps');
	const click_handler_3 = () => $$invalidate(0, source = 'serial');
	const click_handler_4 = () => $$invalidate(0, source = 'http');

	function input_change_handler() {
		useCompass = this.checked;
		$$invalidate(6, useCompass);
	}

	function select_change_handler() {
		baudRate = select_value(this);
		$$invalidate(1, baudRate);
	}

	function input_input_handler() {
		httpUrl = this.value;
		$$invalidate(2, httpUrl);
	}

	function select_change_handler_1() {
		pollSeconds = select_value(this);
		$$invalidate(3, pollSeconds);
	}

	function input_change_input_handler() {
		index = to_number(this.value);
		$$invalidate(9, index);
	}

	const change_handler = () => syncTimestamp(true);

	function input0_change_handler() {
		syncTime = this.checked;
		$$invalidate(4, syncTime);
	}

	function input1_change_handler() {
		follow = this.checked;
		$$invalidate(5, follow);
	}

	function input1_input_handler() {
		refUrl = this.value;
		$$invalidate(12, refUrl);
	}

	$$self.$$.update = () => {
		if ($$self.$$.dirty[0] & /*source, baudRate, httpUrl, pollSeconds, syncTime, follow, useCompass*/ 127) {
			try {
				localStorage.setItem(SETTINGS_KEY, JSON.stringify({
					source,
					baudRate,
					httpUrl,
					pollSeconds,
					syncTime,
					follow,
					useCompass
				}));
			} catch {
				
			}
		}

		if ($$self.$$.dirty[0] & /*refPoints*/ 128) {
			$$invalidate(20, refDistance = routeLength(refPoints));
		}

		if ($$self.$$.dirty[0] & /*points, index*/ 768) {
			$$invalidate(10, current = points[index]);
		}

		if ($$self.$$.dirty[0] & /*current, refPoints*/ 1152) {
			$$invalidate(19, refInfo = current && refPoints.length > 1
			? routeProgress(current.lat, current.lon, refPoints)
			: null);
		}

		if ($$self.$$.dirty[0] & /*points*/ 256) {
			$$invalidate(18, stats = computeStats(points));
		}

		if ($$self.$$.dirty[0] & /*current*/ 1024) {
			if (current) {
				updateBoat(current);
			}
		}
	};

	return [
		source,
		baudRate,
		httpUrl,
		pollSeconds,
		syncTime,
		follow,
		useCompass,
		refPoints,
		points,
		index,
		current,
		refName,
		refUrl,
		live,
		error,
		playing,
		windInfo,
		windMsg,
		stats,
		refInfo,
		refDistance,
		title,
		serialSupported,
		geoSupported,
		fitRef,
		clearRef,
		onRefFile,
		loadRefUrl,
		fmt,
		fmtDeg,
		fmtDuration,
		fitTrack,
		syncTimestamp,
		togglePlay,
		onFile,
		startLive,
		stopLive,
		clearTrack,
		onopen,
		click_handler,
		click_handler_1,
		click_handler_2,
		click_handler_3,
		click_handler_4,
		input_change_handler,
		select_change_handler,
		input_input_handler,
		select_change_handler_1,
		input_change_input_handler,
		change_handler,
		input0_change_handler,
		input1_change_handler,
		input1_input_handler
	];
}

class Plugin extends SvelteComponent {
	constructor(options) {
		super();
		init(this, options, instance, create_fragment, safe_not_equal, { onopen: 38 }, add_css, [-1, -1, -1]);
	}

	get onopen() {
		return this.$$.ctx[38];
	}
}


// transformCode: Export statement was modified
export { __pluginConfig, Plugin as default };
//# sourceMappingURL=plugin.js.map
