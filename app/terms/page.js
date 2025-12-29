export const metadata = {
  title: "Terms of Service | ClientFlow",
}

export default function Terms() {
  return (
    <div className="min-h-screen bg-aa-bg py-16 px-4">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-aa-text mb-8">Terms of Service</h1>
        <div className="prose prose-invert max-w-none text-aa-muted space-y-6">
          <p><strong className="text-aa-text">Last updated:</strong> December 29, 2025</p>

          <h2 className="text-xl font-semibold text-aa-text mt-8">Service Description</h2>
          <p>ClientFlow is a usage monitoring tool that connects to your Gmail to track usage alerts from no-code platforms (Zapier, Make.com, Airtable, Bubble) and predict when you might hit your limits.</p>

          <h2 className="text-xl font-semibold text-aa-text mt-8">Beta Status</h2>
          <p>ClientFlow is currently in beta. The service is provided "as is" without warranty. Features may change and occasional downtime may occur.</p>

          <h2 className="text-xl font-semibold text-aa-text mt-8">Your Responsibilities</h2>
          <ul className="list-disc pl-6 space-y-2">
            <li>You must have the right to access the Gmail account you connect</li>
            <li>You are responsible for maintaining the security of your account</li>
            <li>You agree not to misuse the service or attempt to access others' data</li>
          </ul>

          <h2 className="text-xl font-semibold text-aa-text mt-8">Limitations</h2>
          <ul className="list-disc pl-6 space-y-2">
            <li>Predictions are estimates based on historical data and may not be accurate</li>
            <li>We are not responsible for any overages or charges from third-party platforms</li>
            <li>Service availability is not guaranteed</li>
          </ul>

          <h2 className="text-xl font-semibold text-aa-text mt-8">Termination</h2>
          <p>You may stop using the service at any time. We reserve the right to suspend accounts that violate these terms.</p>

          <h2 className="text-xl font-semibold text-aa-text mt-8">Contact</h2>
          <p>Questions? Email <a href="mailto:cameron@clientflow.dev" className="text-aa-primary hover:underline">cameron@clientflow.dev</a></p>
        </div>
      </div>
    </div>
  )
}
