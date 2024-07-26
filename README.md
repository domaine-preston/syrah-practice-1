# Project Syrah

## Setup

1. Clone the repository to your local machine:

```bash
git clone https://github.com/meetdomaine/project-syrah.git
```

2. Navigate to the project directory:

```bash
cd project-syrah
```

3. Install the required dependencies using npm:

```bash
npm install
```

4. Setup the Development theme for yourself by running

```bash
npx @meetdomaine/cli@latest theme setup
```

## Setup Theme TOML

1. Create a new file called `shopify.theme.toml` using `shopify.theme.example.toml` in the root directory of your project.
2. Copy the contents of the example `shopify.theme.toml` file provided by Shopify.
3. Replace the placeholder values in the `shopify.theme.toml` file with the appropriate values for your Shopify store:

- Replace `{{storeHandle}}` with your Shopify store name.
- Replace `{{themeAccessToken}}` with the theme access password obtained from the [Theme Access App](https://apps.shopify.com/theme-access) in your Shopify store.

4. Save the `shopify.theme.toml` file.

## Development with VS Code

To develop with VS Code, follow these steps:

1. Open the project in VS Code.
2. In the sidebar, click on the "Run and Debug" icon (or press Ctrl+Shift+D).
3. In the top toolbar, click on the "Run" dropdown menu.
4. Select "Start Development".
5. Click on the green play button to start running your code.

## Attach Debugger to VS Code

To attach the debugger to VS Code and enable debugging in your TypeScript/JavaScript component files, follow these steps:

1. Start the development server by following the "Development with VS Code" steps mentioned above.
2. In the VS Code sidebar, click on the "Run and Debug" icon (or press Ctrl+Shift+D).
3. In the top toolbar, click on the "Run" dropdown menu.
4. Select "Open Chrome & Attach Debugger" and Click on the green play button.
5. A new Chrome Window Opens.
6. Add the `debugger` statement anywhere in your TypeScript/JavaScript component file where you want to set a breakpoint.
7. The debugger from VS Code will now be connected to your browser, allowing you to debug your code.

## Development with OS Terminal

To start the development server, run the following command: `npm run dev`

## Add New JS/TS File to be Built as Entry Point

To add a new JavaScript or TypeScript file to be built as an entry point, follow these steps:

1. Navigate to the `src/entry` directory.
2. Create a new file with a `.ts` or `.js` extension.
3. Inside the new file, extend the `BaseElement` class located in `src/base/`. This will allow you to reuse global CSS styles and Tailwind CSS classes.
4. Save the file.

The new file will be treated as a file that will be compiled to JavaScript and bundled inside the assets folder of the theme.

## Inline Styles for LitComponent and using Tailwind Inside them

We can leverage Vite CSS Inlining and use TW inside Lit Component in special cases where we are leveraging the styles property of the LitElements.

To add styles to a LitElement, create a new .css file in the src/styles folder (e.g., component-only-css.css) and add styles for the file. You can leverage Tailwind CSS functions like @apply, @layer, @screen to make use of Tailwind CSS utilities.

Import the CSS file to the LitComponent file using the following format: `import styles from '/path/to/css/file.css?inline'`. The `styles` variable will be hydrated by Vite with the compiled CSS string, and this can be simply assigned to the LitElement's `styles` property.

Here is an example code snippet for the LitElement with inlined styles using Tailwind CSS:

example.css

```
.component {
  @apply block bg-brand-primary;
}

:host {
  @apply relative block;
}
```

example-component.ts

```
// @ts-ignore
import styles from './styles/examples.css?inline'

class ExampleComponent extends BaseElement {
  static styles = [unsafeCSS(styles)]
}
```

## Working with Fonts and Tailwind Syrah

- Tailwind Syrah, our custom Tailwind plugin, automatically generates CSS with font-family properties set using the variables defined below. If the font names provided in your design manifest do not match exactly, you can override these variables to ensure consistency in your styles. eg. `--font-family-primary`

- If your custom font names differ from those in your design manifest, you can override these variables in your CSS. For example, if your design uses a different primary font, you can set the variable like this:

```
:root {
  --font-family-primary: 'Poppins';
  --font-family-secondary: 'Poppins';
  --font-family-tertiary: 'Poppins';
  --font-family-quaternary: 'Poppins';
}

```

This will ensure that all primary text elements use 'Poppins' instead of the default from design.manifest.json

### Debugging Tailwind Syrah

Tailwind Syrah uses the Standard node debugger with namespace, `tailwind-syrah*`, so debug logs can be viewed by updating the `theme:assets` task with `export DEBUG='tailwind-syrah*' && npm run dev`. This will expose deep logging from the plugin.

## Design System

You can find the Project Syrah Demo built using the `styleguide.liquid` layout, by creating a new page on shopify admin using page template provided with name `page.styleguide.json` that internally uses `component-styleguide.liquid` section.

Preview is available at the [demo store.](https://project-syrah.myshopify.com/pages/style-guide) / Password: `thenextone`

## Deployment

To deploy your project using GitHub Actions, follow these steps:

1. Create a new environment on your GitHub repository, such as "Dev".

2. Set up an environment variable named `SHOPIFY_FLAG_STORE` with the URL of your Shopify store (e.g., `https://yourstore.myshopify.com`).

3. Generate a Shopify CLI theme token using the Theme Access app installed on your store.

4. Set up an environment secret named `SHOPIFY_CLI_THEME_TOKEN` and paste the generated theme token as the value.

5. Use the `deploy.yml` GitHub Actions workflow file for deploying to a single store, or use the `deployAll.yml` workflow file for deploying to multiple stores.

6. Leverage the Actions Panel of the repository to open the Deploy V2, click on Run Workflow, choose the branch we want to deploy from and run workflow for the environment of choice

By following these steps, you can automate the deployment process of your project using GitHub Actions and ensure a smooth release to your Shopify store(s).
