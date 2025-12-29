export const metadata = {
  title: "Privacy Policy | ClientFlow",
}

export default function Privacy() {
  return (
    <div className="min-h-screen bg-aa-bg py-16 px-4">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-aa-text mb-8">Privacy Policy</h1>
        <div className="prose prose-invert max-w-none text-aa-muted space-y-6">
          <p><strong className="text-aa-text">Last updated:</strong> December 29, 2025</p>

          <h2 className="text-xl font-semibold text-aa-text mt-8">What We Collect</h2>
          <p>ClientFlow accesses your Gmail account (read-only) to scan for usage alert emails from no-code platforms like Zapier, Make.com, Airtable, and Bubble. We collect:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Your email address and name (for account identification)</li>
            <li>Usage alert emails from supported platforms (sender, subject, date, usage percentages)</li>
          </ul>

          <h2 className="text-xl font-semibold text-aa-text mt-8">What We Don't Collect</h2>
          <ul className="list-disc pl-6 space-y-2">
            <li>We do not read personal emails</li>
            <li>We do not store email content beyond extracted usage metrics</li>
            <li>We do not share your data with third parties</li>
          </ul>

          <h2 className="text-xl font-semibold text-aa-text mt-8">How We Use Your Data</h2>
          <p>We use the extracted usage data to:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Display your platform usage history</li>
            <li>Predict when you might hit usage limits</li>
            <li>Send you alerts before overages occur</li>
          </ul>

          <h2 className="text-xl font-semibold text-aa-text mt-8">Data Security</h2>
          <p>Your data is stored securely in encrypted databases. OAuth tokens are stored securely and used only to access your Gmail on your behalf.</p>

          <h2 className="text-xl font-semibold text-aa-text mt-8">Data Deletion</h2>
          <p>You can request deletion of your account and all associated data by contacting cameron@clientflow.dev.</p>

          <h2 className="text-xl font-semibold text-aa-text mt-8">Contact</h2>
          <p>Questions? Email <a href="mailto:cameron@clientflow.dev" className="text-aa-primary hover:underline">cameron@clientflow.dev</a></p>
        </div>
      </div>
    </div>
  )
}
