import Link from 'next/link';

export default function Page() {
  return (
    <div className="grid gap-8">
      <section className="card text-center">
        <h1 className="text-3xl font-bold mb-2">Now Serving California Drivers</h1>
        <p className="text-[color:var(--muted)] mb-6">
          Membership that helps with your deductible, roadside, and more.
        </p>
        <div className="flex gap-3 justify-center">
          <Link href="/auth/sign-up" className="btn btn-primary">Create account</Link>
          <Link href="/auth/sign-in" className="btn btn-secondary">Sign in</Link>
        </div>
      </section>

      <section className="card">
        <h2 className="text-xl font-semibold mb-3">What you get</h2>
        <ul className="space-y-2 text-white/90">
          <li>• Deductible assistance (as part of a member benefits package)</li>
          <li>• Roadside & towing coordination</li>
          <li>• Secure storage for insurance card, registration & photos</li>
          <li>• Easy claim submission</li>
        </ul>
        <p className="mt-6 text-sm text-[color:var(--muted)]">
          Dip Membership is a motor club program, not an insurance policy.
        </p>
      </section>
    </div>
  );
}
