import { features } from "@/lib/data";

export function FeatureStrip() {
  return (
    <section className="container-page -mt-8 pb-4">
      <div className="grid gap-4 rounded-2xl border border-slate-100 bg-white p-6 shadow-md sm:grid-cols-2 lg:grid-cols-4">
        {features.map(({ icon: Icon, title, description }) => (
          <div key={title} className="flex items-center gap-4">
            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-primary-light text-primary">
              <Icon className="h-6 w-6" />
            </span>
            <div>
              <p className="font-heading font-semibold text-dark">{title}</p>
              <p className="text-sm text-slate-500">{description}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
