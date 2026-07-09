import { createBackendApp } from './app';

const port = Number(process.env.PORT ?? 3000);
const app = createBackendApp();

app.listen(port, () => {
  console.log(`Figma to LWC backend listening on port ${port}`);
});
