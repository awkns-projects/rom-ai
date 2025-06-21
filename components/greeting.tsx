import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import Marquee from "@/components/magicui/marquee";
import { ChevronRight, HeartHandshake } from "lucide-react";

const reviews = [
  {
    name: "🛒 Auto-Selling Store",
    body: "\"Build me an online store\" → AI agent that handles customer inquiries, processes orders, manages inventory, and upsells products while I sleep.",
    img: "https://avatar.vercel.sh/ecommerce",
  },
  {
    name: "💰 Deal-Closing Machine",
    body: "\"Help me sell consulting\" → AI agent that qualifies leads, books discovery calls, sends proposals, and follows up until deals close.",
    img: "https://avatar.vercel.sh/crm-user",
  },
  {
    name: "📝 Content Empire Builder",
    body: "\"I need social media content\" → AI agent that researches trends, creates posts, schedules content, and engages with followers across all platforms.",
    img: "https://avatar.vercel.sh/content-manager",
  },
  {
    name: "📅 Appointment Autopilot",
    body: "\"Manage my calendar\" → AI agent that handles bookings, sends reminders, reschedules conflicts, and optimizes my daily schedule automatically.",
    img: "https://avatar.vercel.sh/booking-system",
  },
  {
    name: "📊 Profit Prophet",
    body: "\"Track my business metrics\" → AI agent that monitors KPIs, predicts trends, alerts me to opportunities, and generates weekly strategy reports.",
    img: "https://avatar.vercel.sh/analytics-tool",
  },
  {
    name: "🎓 Teaching Titan",
    body: "\"Create an online course\" → AI agent that teaches students, answers questions, grades assignments, and provides personalized learning paths.",
    img: "https://avatar.vercel.sh/learning-platform",
  },
];

const firstRow = reviews.slice(0, reviews.length / 2);
const secondRow = reviews.slice(reviews.length / 2);

const ReviewCard = ({
  img,
  name,
  body,
}: {
  img: string;
  name: string;
  body: string;
}) => {
  return (
    <figure
      className={cn(
        "relative w-80 cursor-pointer overflow-hidden rounded-[2rem] border p-6",
        // light styles
        "border-gray-950/[.1] bg-gray-950/[.01] hover:bg-gray-950/[.05]",
        // dark styles
        "dark:border-gray-50/[.1] dark:bg-gray-50/[.10] dark:hover:bg-gray-50/[.15]",
      )}
    >
      <div className="flex flex-row items-center gap-3 mb-3">
        <img className="rounded-full" width="40" height="40" alt="" src={img} />
        <figcaption className="text-base font-bold dark:text-white">
          {name}
        </figcaption>
      </div>
      <blockquote className="text-sm leading-relaxed">{body}</blockquote>
    </figure>
  );
};

export const Greeting = () => {
  return (
    <section id="greeting">
      <div className="py-14">
        <div className="container flex w-full flex-col items-center justify-center p-4 mx-auto">
          <div className="relative flex w-full max-w-[1000px] flex-col items-center justify-center overflow-hidden rounded-[2rem] border p-10 py-14 mx-auto">
            <div className="absolute rotate-[35deg]">
              <Marquee pauseOnHover className="[--duration:20s]" repeat={3}>
                {firstRow.map((review) => (
                  <ReviewCard key={review.name} {...review} />
                ))}
              </Marquee>
              <Marquee
                reverse
                pauseOnHover
                className="[--duration:20s]"
                repeat={3}
              >
                {secondRow.map((review) => (
                  <ReviewCard key={review.name} {...review} />
                ))}
              </Marquee>
              <Marquee pauseOnHover className="[--duration:20s]" repeat={3}>
                {firstRow.map((review) => (
                  <ReviewCard key={review.name} {...review} />
                ))}
              </Marquee>
              <Marquee
                reverse
                pauseOnHover
                className="[--duration:20s]"
                repeat={3}
              >
                {secondRow.map((review) => (
                  <ReviewCard key={review.name} {...review} />
                ))}
              </Marquee>
              <Marquee pauseOnHover className="[--duration:20s]" repeat={3}>
                {firstRow.map((review) => (
                  <ReviewCard key={review.name} {...review} />
                ))}
              </Marquee>
              <Marquee
                reverse
                pauseOnHover
                className="[--duration:20s]"
                repeat={3}
              >
                {secondRow.map((review) => (
                  <ReviewCard key={review.name} {...review} />
                ))}
              </Marquee>
            </div>
            <div className="z-10 mx-auto size-24 rounded-[2rem] border bg-white/10 p-3 shadow-2xl backdrop-blur-md dark:bg-black/10 lg:size-32">
                <img src="/images/logo.png" className="mx-auto size-16 text-black dark:text-white lg:size-24" />
              {/* <HeartHandshake className="mx-auto size-16 text-black dark:text-white lg:size-24" /> */}
            </div>
            <div className="z-10 mt-8 flex flex-col items-center text-center text-black dark:text-white w-full max-w-5xl mx-auto px-6">
              <h1 className="text-2xl font-extralight sm:text-3xl lg:text-4xl text-center text-black dark:text-white font-mono tracking-[0.2em] mb-8 opacity-90">
                Rom Cards
              </h1>
              <p className="text-base sm:text-lg lg:text-xl text-center max-w-4xl mx-auto font-extralight font-mono text-matrix-gradient leading-loose tracking-wide opacity-85 px-4">
                The easiest no-code tool to build apps, AI agents, CRMs & automations. 
                <span className="block mt-3 text-sm sm:text-base lg:text-lg text-gray-400 dark:text-green-300/50 font-light tracking-wider">
                  Build anything, then license it for profit — all built in.
                </span>
              </p>
            </div>
            <div className="absolute inset-x-0 bottom-0 h-full bg-gradient-to-b from-transparent to-white to-70% dark:to-black" />
          </div>
        </div>
      </div>
    </section>
  );
};
