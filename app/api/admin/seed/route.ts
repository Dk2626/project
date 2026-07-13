import { connectDB } from "@/lib/db";
import { User } from "@/models/User";
import { Job } from "@/models/Job";
import { Webinar } from "@/models/Webinar";
import { hashPassword } from "@/lib/auth";
import { ok, fail, handle } from "@/lib/api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Bootstrap the first admin account and some sample content.
 * Protected by the ADMIN_SETUP_KEY env var — send it as the x-setup-key header.
 * Safe to call more than once (upserts the admin, seeds samples only if empty).
 */
export async function POST(req: Request) {
  return handle(async () => {
    const key = process.env.ADMIN_SETUP_KEY;
    if (!key) return fail("ADMIN_SETUP_KEY is not configured on the server.", 503);
    if (req.headers.get("x-setup-key") !== key)
      return fail("Invalid setup key.", 401);

    const body = await req.json().catch(() => ({}));
    const email = (body.email || "admin@urav.com").toLowerCase();
    const password = body.password || "Admin@12345";

    await connectDB();

    let admin = await User.findOne({ email });
    if (!admin) {
      admin = await User.create({
        firstName: body.firstName || "URAV",
        lastName: body.lastName || "Admin",
        email,
        password: await hashPassword(password),
        role: "admin",
      });
    } else if (admin.role !== "admin") {
      admin.role = "admin";
      await admin.save();
    }

    let seededJobs = 0;
    let seededWebinars = 0;

    if ((await Job.countDocuments()) === 0) {
      const res = await Job.insertMany([
        {
          title: "Frontend Developer",
          company: "TechNova Solutions",
          location: "Remote",
          type: "Full Time",
          experience: "1-3 years",
          salary: "₹6-10 LPA",
          description:
            "Build modern, accessible web interfaces with React and TypeScript. Work closely with design and backend teams.",
          skills: ["React", "TypeScript", "Tailwind CSS"],
        },
        {
          title: "Business Analyst",
          company: "InnovateX",
          location: "Bangalore",
          type: "Full Time",
          experience: "0-2 years",
          salary: "₹5-8 LPA",
          description:
            "Translate business needs into clear requirements and dashboards. Strong communication and SQL skills preferred.",
          skills: ["SQL", "Excel", "Communication"],
        },
        {
          title: "UI/UX Design Intern",
          company: "Pixel Perfect",
          location: "Hybrid — Chennai",
          type: "Internship",
          experience: "Fresher",
          salary: "₹15,000/month",
          description:
            "Support the design team on wireframes, prototypes and user research for real client products.",
          skills: ["Figma", "Prototyping", "User Research"],
        },
      ]);
      seededJobs = res.length;
    }

    if ((await Webinar.countDocuments()) === 0) {
      const res = await Webinar.insertMany([
        {
          title: "AI in Business Transformation",
          speaker: "Dr. Sarah Johnson",
          date: "2025-08-24",
          time: "10:00 AM",
          description:
            "How organizations are adopting AI to reimagine operations and customer experience.",
          live: true,
        },
        {
          title: "Marketing Strategies for 2025",
          speaker: "Michael Smith",
          date: "2025-08-28",
          time: "11:00 AM",
          description: "Practical, channel-by-channel tactics for the year ahead.",
        },
        {
          title: "Data Analytics with Python",
          speaker: "David Brown",
          date: "2025-08-30",
          time: "02:00 PM",
          description:
            "A hands-on introduction to analysing data with pandas and visualising results.",
        },
      ]);
      seededWebinars = res.length;
    }

    return ok({
      admin: { email, role: "admin" },
      note:
        admin.role === "admin"
          ? "Admin ready. Log in with the email/password you seeded."
          : "Admin created.",
      seededJobs,
      seededWebinars,
    });
  });
}
