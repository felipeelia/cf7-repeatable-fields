// ***********************************************
// This example commands.js shows you how to
// create various custom commands and overwrite
// existing commands.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************
//
//
// -- This is a parent command --
// Cypress.Commands.add('login', (email, password) => { ... })
//
//
// -- This is a child command --
// Cypress.Commands.add('drag', { prevSubject: 'element'}, (subject, options) => { ... })
//
//
// -- This is a dual command --
// Cypress.Commands.add('dismiss', { prevSubject: 'optional'}, (subject, options) => { ... })
//
//
// -- This will overwrite an existing command --
// Cypress.Commands.overwrite('visit', (originalFn, url, options) => { ... })

Cypress.Commands.add('visitAdminPage', (page = 'index.php') => {
	cy.login();
	if (page.includes('http')) {
		cy.visit(page);
	} else {
		cy.visit(`/wp-admin/${page.replace(/^\/|\/$/g, '')}`);
	}
});

Cypress.Commands.add(
	'clearThenType',
	{ prevSubject: true },
	(subject, text, force = false) => {
		/* eslint-disable-next-line cypress/unsafe-to-chain-command */
		cy.wrap(subject).clear().type(text, { force });
	}
);

Cypress.Commands.add('wpCliEvalCustom', (command) => {
	const fileName = (Math.random() + 1).toString(36).substring(7);

	// this will be written "local" plugin directory
	const escapedCommand = command.replace(/^<\?php /, '');
	cy.writeFile(fileName, `<?php ${escapedCommand}`);

	cy.exec('echo $(basename $(pwd))').then((result) => {
		const pluginName = result.stdout;

		// which is read from it's proper location in the plugins directory
		cy.exec(
			`npm --silent run env run tests-cli wp eval-file wp-content/plugins/${pluginName}/${fileName}` // eslint-disable-line @typescript-eslint/restrict-template-expressions
		).then((commandResult) => {
			cy.exec(`rm ${fileName}`);
			cy.wrap(commandResult);
		});
	});
});

Cypress.Commands.add('wpCliCustom', (command, ignoreFailures = false) => {
	const escapedCommand = command.replace(/"/g, '\\"').replace(/^wp /, '');
	const options = {
		failOnNonZeroExit: !ignoreFailures,
	};
	cy.exec(
		`npm --silent run env run tests-cli wp ${escapedCommand}`,
		options
	).then((result) => {
		cy.wrap(result);
	});
});
