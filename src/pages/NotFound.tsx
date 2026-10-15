import { Label, Button } from "../components/UI";

export function NotFound() {
  return (
    <section className="section not-found">
      <Label>404 / CONNECTION NOT FOUND</Label>
      <h1>
        A little
        <br />
        <span className="green">off route.</span>
      </h1>
      <p>This page doesn’t exist. Let’s get you connected again.</p>
      <Button to="/">Back to home</Button>
    </section>
  );
}
