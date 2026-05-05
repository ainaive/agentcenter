export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 px-8">
      <div className="flex items-center gap-3">
        <div className="bg-primary text-primary-foreground flex h-10 w-10 items-center justify-center rounded-full">
          <span className="serif text-lg font-medium italic">A</span>
        </div>
        <h1 className="serif text-3xl tracking-tight">
          Agent
          <span className="text-primary font-light italic">Center</span>
        </h1>
      </div>
      <p className="text-muted-foreground max-w-sm text-center text-sm">
        Discover and extend your AI agents. Phase 0 bootstrap — visual shell
        coming in Phase 1.
      </p>
    </main>
  );
}
