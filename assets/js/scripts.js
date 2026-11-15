/**
 * Repeatable groups for Contact Form 7.
 *
 * Bubbling CustomEvents:
 * - wpcf7-field-groups/change: dispatched on the groups container.
 * - wpcf7-field-groups/added: dispatched on the add button; detail.group is the new row.
 * - wpcf7-field-groups/removed: dispatched on the remove button before removal;
 *   detail.group is the row being removed.
 */
(() => {
	'use strict';

	/**
	 * Dispatch a repeatable-group event.
	 *
	 * @param {Element} target  Event target.
	 * @param {string}  name    Event name without the prefix.
	 * @param {Element} [group] Added or removed row.
	 */
	function dispatchGroupEvent(target, name, group) {
		target.dispatchEvent(
			new CustomEvent(`wpcf7-field-groups/${name}`, {
				bubbles: true,
				detail: group ? { group } : null,
			})
		);
	}

	/**
	 * Keep field names, validation wrappers and row counts in sync.
	 *
	 * @param {Element} container Groups container.
	 */
	function updateGroups(container) {
		const rows = container.querySelectorAll('.wpcf7-field-group');
		rows.forEach((row, index) => {
			row.querySelectorAll('.wpcf7-field-group-remove').forEach(
				(button) => {
					button.style.display = index > 0 ? '' : 'none';
				}
			);
			row.querySelectorAll('[name]').forEach((field) => {
				const name = field.getAttribute('name');
				const isArray = name.includes('[]');
				const rawName = name.replace('[]', '');
				const newName =
					rawName.replace(/__[0-9]*/, '') + '__' + (index + 1);
				const wrapper = field.closest('.wpcf7-form-control-wrap');
				if (wrapper) {
					wrapper.dataset.name = newName;
					if (!wrapper.classList.contains(newName)) {
						wrapper.classList.remove(rawName);
						wrapper.classList.add(newName);
					}
				}
				field.setAttribute('name', newName + (isArray ? '[]' : ''));
			});
		});
		container
			.querySelectorAll('.wpcf7-field-group-count')
			.forEach((field) => {
				field.value = rows.length;
			});
	}

	/**
	 * Resolve CF7's asynchronously loaded schema per form instance.
	 *
	 * @param {HTMLFormElement} form Contact form.
	 */
	function initializeSchema(form) {
		if (!form.wpcf7) {
			return;
		}
		const schemaGetter = Object.getOwnPropertyDescriptor(
			form.wpcf7,
			'schema'
		)?.get;
		if (!schemaGetter) {
			return;
		}
		Object.defineProperty(form.wpcf7, 'schema', {
			get() {
				const schema = schemaGetter.call(this);
				if (!schema) {
					return schema;
				}
				const repeatedFields = new Map();
				form.querySelectorAll(
					'.wpcf7-field-groups .wpcf7-form-control-wrap[data-name]'
				).forEach((wrapper) => {
					const name = wrapper.dataset.name;
					const originalName = name.replace(/__\d+$/, '');
					if (!repeatedFields.has(originalName)) {
						repeatedFields.set(originalName, new Set());
					}
					repeatedFields.get(originalName).add(name);
				});
				const expandRules = (rules) =>
					rules.flatMap((rule) => {
						const expanded = rule.rules
							? { ...rule, rules: expandRules(rule.rules) }
							: rule;
						const names = repeatedFields.get(rule.field);
						return names
							? Array.from(names, (field) => ({
									...expanded,
									field,
								}))
							: [expanded];
					});
				return { ...schema, rules: expandRules(schema.rules) };
			},
		});
	}

	/**
	 * Initialize the groups rendered on this page.
	 */
	function initialize() {
		const groups = document.querySelectorAll('.wpcf7-field-groups');
		if (!groups.length) {
			return;
		}

		const models = new WeakMap();
		const forms = new Set();
		groups.forEach((container) => {
			models.set(
				container,
				container.querySelector('.wpcf7-field-group').cloneNode(true)
			);
			const form = container.closest('form');
			if (form) {
				forms.add(form);
			}
		});
		forms.forEach(initializeSchema);

		document.body.addEventListener('wpcf7-field-groups/change', (event) => {
			const container = event.target.closest('.wpcf7-field-groups');
			if (models.has(container)) {
				updateGroups(container);
			}
		});
		groups.forEach((container) => dispatchGroupEvent(container, 'change'));

		document.body.addEventListener('click', (event) => {
			const button = event.target.closest(
				'.wpcf7-field-group-add, .wpcf7-field-group-remove'
			);
			const container = button?.closest('.wpcf7-field-groups');
			if (!models.has(container)) {
				return;
			}
			event.preventDefault();
			event.stopPropagation();

			if (button.classList.contains('wpcf7-field-group-add')) {
				const row = models.get(container).cloneNode(true);
				container.append(row);
				dispatchGroupEvent(button, 'added', row);
			} else {
				const row = button.closest('.wpcf7-field-group');
				dispatchGroupEvent(button, 'removed', row);
				row.remove();
			}
			dispatchGroupEvent(container, 'change');
		});

		// CF7's direct listeners are not copied by cloneNode. Delegate exclusive
		// checkbox handling so it also works in newly added rows.
		document.body.addEventListener('click', (event) => {
			const checkbox = event.target.closest(
				'.wpcf7-exclusive-checkbox input[type="checkbox"]'
			);
			if (
				!checkbox ||
				!models.has(checkbox.closest('.wpcf7-field-groups'))
			) {
				return;
			}
			checkbox
				.closest('.wpcf7-exclusive-checkbox')
				.querySelectorAll('input[type="checkbox"]')
				.forEach((other) => {
					if (other !== checkbox && other.name === checkbox.name) {
						other.checked = false;
					}
				});
		});
	}

	if (document.readyState === 'loading') {
		document.addEventListener('DOMContentLoaded', initialize, {
			once: true,
		});
	} else {
		initialize();
	}
})();
