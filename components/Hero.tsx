import { Video, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/Button";

export function Hero() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-primary-light/60 to-white">
      <div className="container-page grid items-center gap-12 py-16 md:grid-cols-2 md:py-24">
        {/* Left: copy */}
        <div>
          <h1 className="h1 text-dark">
            Empowering Careers.
            <br />
            Building Futures.
          </h1>
          <p className="mt-6 max-w-md text-base leading-relaxed text-slate-600">
            URAV is a corporate consulting and career platform that connects
            students, professionals and organizations through learning, webinars
            and job opportunities.
          </p>
          <div className="mt-8 flex flex-wrap gap-4">
            <Button variant="primary" href="/webinars">
              Explore Webinars
            </Button>
            <Button variant="outline" href="/jobs">
              Browse Jobs
            </Button>
          </div>
        </div>

        {/* Right: portrait placeholder + floating cards */}
        <div className="relative mx-auto w-full max-w-md">
          <div className="aspect-[4/5] w-full overflow-hidden rounded-2xl bg-primary-light shadow-lg">
            {/*
              To swap in a different photo, drop it in /public and update src.
              A .jpg fallback (hero-students.jpg) is also available if needed.
            */}
            <img
              src="/hero-students.webp"
              alt="Two students walking together on campus"
              className="h-full w-full object-cover"
              style={{ objectPosition: "center 30%" }}
            />
          </div>

          {/* Floating stat: Webinars */}
          <div className="absolute -left-4 top-10 flex items-center gap-3 rounded-xl bg-white px-4 py-3 shadow-lg">
            <span className="grid h-9 w-9 place-items-center rounded-md bg-primary-light text-primary">
              <Video className="h-5 w-5" />
            </span>
            <div>
              <p className="text-xs text-slate-500">Webinars</p>
              <p className="font-heading text-lg font-bold text-dark">120+</p>
            </div>
          </div>

          {/* Floating stat: Placed */}
          <div className="absolute -right-2 bottom-10 flex items-center gap-3 rounded-xl bg-white px-4 py-3 shadow-lg">
            <span className="grid h-9 w-9 place-items-center rounded-md bg-success/10 text-success">
              <CheckCircle2 className="h-5 w-5" />
            </span>
            <div>
              <p className="text-xs text-slate-500">Placed</p>
              <p className="font-heading text-lg font-bold text-dark">2.5K+</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
