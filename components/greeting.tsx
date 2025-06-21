import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import Marquee from "@/components/magicui/marquee";
import { ChevronRight, HeartHandshake } from "lucide-react";

const reviews = [
  {
    name: "Customer Support AI",
    username: "@support_bot",
    body: "24/7 intelligent customer service that handles inquiries, resolves issues, and escalates complex cases to human agents.",
    img: "https://avatar.vercel.sh/customer-support",
  },
  {
    name: "Sales Lead Qualifier",
    username: "@sales_ai",
    body: "Automatically qualifies leads, schedules meetings, and nurtures prospects through personalized email sequences.",
    img: "https://avatar.vercel.sh/sales-ai",
  },
  {
    name: "Content Creator AI",
    username: "@content_bot",
    body: "Generates blog posts, social media content, and marketing copy tailored to your brand voice and audience.",
    img: "https://avatar.vercel.sh/content-ai",
  },
  {
    name: "Data Analyst Agent",
    username: "@data_ai",
    body: "Analyzes business metrics, generates insights, and creates automated reports with actionable recommendations.",
    img: "https://avatar.vercel.sh/data-analyst",
  },
  {
    name: "HR Recruitment Bot",
    username: "@hr_ai",
    body: "Screens resumes, schedules interviews, and matches candidates to job requirements using AI-powered assessment.",
    img: "https://avatar.vercel.sh/hr-bot",
  },
  {
    name: "Inventory Manager AI",
    username: "@inventory_ai",
    body: "Tracks stock levels, predicts demand, automates reordering, and optimizes supply chain operations.",
    img: "https://avatar.vercel.sh/inventory-ai",
  },
];

const firstRow = reviews.slice(0, reviews.length / 2);
const secondRow = reviews.slice(reviews.length / 2);

const ReviewCard = ({
  img,
  name,
  username,
  body,
}: {
  img: string;
  name: string;
  username: string;
  body: string;
}) => {
  return (
    <figure
      className={cn(
        "relative w-64 cursor-pointer overflow-hidden rounded-[2rem] border p-4",
        // light styles
        "border-gray-950/[.1] bg-gray-950/[.01] hover:bg-gray-950/[.05]",
        // dark styles
        "dark:border-gray-50/[.1] dark:bg-gray-50/[.10] dark:hover:bg-gray-50/[.15]",
      )}
    >
      <div className="flex flex-row items-center gap-2">
        <img className="rounded-full" width="32" height="32" alt="" src={img} />
        <div className="flex flex-col">
          <figcaption className="text-sm font-medium dark:text-white">
            {name}
          </figcaption>
          <p className="text-xs font-medium dark:text-white/40">{username}</p>
        </div>
      </div>
      <blockquote className="mt-2 text-sm">{body}</blockquote>
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
                  <ReviewCard key={review.username} {...review} />
                ))}
              </Marquee>
              <Marquee
                reverse
                pauseOnHover
                className="[--duration:20s]"
                repeat={3}
              >
                {secondRow.map((review) => (
                  <ReviewCard key={review.username} {...review} />
                ))}
              </Marquee>
              <Marquee pauseOnHover className="[--duration:20s]" repeat={3}>
                {firstRow.map((review) => (
                  <ReviewCard key={review.username} {...review} />
                ))}
              </Marquee>
              <Marquee
                reverse
                pauseOnHover
                className="[--duration:20s]"
                repeat={3}
              >
                {secondRow.map((review) => (
                  <ReviewCard key={review.username} {...review} />
                ))}
              </Marquee>
              <Marquee pauseOnHover className="[--duration:20s]" repeat={3}>
                {firstRow.map((review) => (
                  <ReviewCard key={review.username} {...review} />
                ))}
              </Marquee>
              <Marquee
                reverse
                pauseOnHover
                className="[--duration:20s]"
                repeat={3}
              >
                {secondRow.map((review) => (
                  <ReviewCard key={review.username} {...review} />
                ))}
              </Marquee>
            </div>
            <div className="z-10 mx-auto size-24 rounded-[2rem] border bg-white/10 p-3 shadow-2xl backdrop-blur-md dark:bg-black/10 lg:size-32">
                <img src="/images/logo.png" className="mx-auto size-16 text-black dark:text-white lg:size-24" />
              {/* <HeartHandshake className="mx-auto size-16 text-black dark:text-white lg:size-24" /> */}
            </div>
            <div className="z-10 mt-4 flex flex-col items-center text-center text-black dark:text-white w-full max-w-4xl mx-auto px-4">
              <h1 className="text-3xl font-bold lg:text-4xl text-center">
                Build, Deploy & Monetize AI-Powered Business Apps
              </h1>
              <p className="mt-2 text-center max-w-2xl mx-auto">
                The no-code platform for creating intelligent CRM systems, AI agents, and data-driven applications that you can license to others.
              </p>
              
            </div>
            <div className="absolute inset-x-0 bottom-0 h-full bg-gradient-to-b from-transparent to-white to-70% dark:to-black" />
          </div>
        </div>
      </div>
    </section>
  );
};
