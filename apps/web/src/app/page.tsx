export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">Welcome to SaaStral</h1>
        <p className="text-xl text-muted-foreground mb-8">
          Open Source SaaS Management Platform
        </p>
        <div className="flex gap-4 justify-center">
          <a
            href="/dashboard"
            className="px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity"
          >
            Get Started
          </a>
          <a
            href="https://github.com/saastral/saastral"
            target="_blank"
            rel="noopener noreferrer"
            className="px-6 py-3 bg-secondary text-secondary-foreground rounded-lg hover:opacity-90 transition-opacity"
          >
            View on GitHub
          </a>
        </div>
      </div>
    </main>
  )
}
