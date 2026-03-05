import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router";
import type { Route } from "./+types/home";
import { resumes } from "../../constants";
import ResumeCard from "~/components/ResumeCard";
import { type HomeFeedResume, isHomeFeedWiped, readHomeFeedItems } from "~/lib/homeFeed";


export function meta({}: Route.MetaArgs) {
  return [
    { title: "Resumind" },
    { name: "description", content: "Smart feedback for your dream job!" },
  ];
}

export default function Home() {
  const [uploadedResumes, setUploadedResumes] = useState<HomeFeedResume[]>([]);
  const [feedWiped, setFeedWiped] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setUploadedResumes(readHomeFeedItems());
    setFeedWiped(isHomeFeedWiped());
    setReady(true);
  }, []);

  const homeResumes = useMemo(() => {
    if (uploadedResumes.length > 0) return uploadedResumes;
    if (feedWiped) return [];
    return resumes;
  }, [uploadedResumes, feedWiped]);

  return ( <main className="bg-[url('/images/bg-main.svg')] bg-cover">
    <section className="main-section">
    <div className="page-heading py-16" >
      <h1> Track Your Application & Resume Ratings</h1>
      <h2>Review your submissions and explore AI-powered feedback</h2>
    </div>

        {homeResumes.length > 0 && (
        <div  className= "resumes-section">
    {homeResumes.map((resume) => (
     <ResumeCard key={resume.id} resume={resume} />
    ))}
  </div>

)}
      {ready && homeResumes.length === 0 && (
          <div className="w-full max-w-3xl bg-white/90 border border-gray-100 rounded-2xl p-8 text-center shadow-lg">
            <h3 className="text-2xl font-semibold text-gray-900">Home feed is clear</h3>
            <p className="text-gray-600 mt-2">
              Upload a real resume to repopulate your dashboard with fresh analysis cards.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-6">
              <Link to="/upload" className="bg-blue-600 text-white px-5 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors">
                Upload Resume
              </Link>
              <Link to="/wipe" className="text-gray-700 px-5 py-3 rounded-lg border border-gray-200 font-semibold hover:bg-gray-50 transition-colors">
                Wipe Settings
              </Link>
            </div>
          </div>
      )}
    </section>
</main>
  )}
