import type { Route } from "./+types/home";
import Navbar from "~/components/Navbar";
import ResumeCard from "~/components/ResumeCard";
import {usePuterStore} from "~/lib/puter";
import {Link, useNavigate} from "react-router";
import {useEffect, useState} from "react";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Resumind" },
    { name: "description", content: "Smart feedback for your dream job!" },
  ];
}

export default function Home() {
  const { auth, kv, fs } = usePuterStore();
  const navigate = useNavigate();
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [loadingResumes, setLoadingResumes] = useState(false);
  const [isWiping, setIsWiping] = useState(false);

  useEffect(() => {
    if(!auth.isAuthenticated) navigate('/auth?next=/');
  }, [auth.isAuthenticated])

  const loadResumes = async () => {
    setLoadingResumes(true);

    const resumes = (await kv.list('resume:*', true)) as KVItem[];

    const parsedResumes = resumes?.map((resume) => (
        JSON.parse(resume.value) as Resume
    ))

    setResumes(parsedResumes || []);
    setLoadingResumes(false);
  }

  useEffect(() => {
    loadResumes()
  }, []);

  const handleWipeData = async () => {
    if (!window.confirm('⚠️ Are you sure you want to delete ALL resumes and data? This action cannot be undone!')) {
      return;
    }

    try {
      setIsWiping(true);

      // Get all files
      const files = (await fs.readDir("./")) as FSItem[];
      
      // Delete all files
      for (const file of files) {
        await fs.delete(file.path);
      }

      // Flush all key-value data
      await kv.flush();

      // Reload resumes (should be empty now)
      await loadResumes();

      alert('✅ All data has been wiped successfully!');
    } catch (error) {
      console.error('Error wiping data:', error);
      alert('❌ Failed to wipe data. Please try again.');
    } finally {
      setIsWiping(false);
    }
  };

  return <main className="bg-[url('/images/bg-main.svg')] bg-cover">
    <Navbar />

    <section className="main-section">
      <div className="page-heading py-16">
        <h1>Track Your Applications & Resume Ratings</h1>
        {!loadingResumes && resumes?.length === 0 ? (
            <h2>No resumes found. Upload your first resume to get feedback.</h2>
        ): (
          <h2>Review your submissions and check AI-powered feedback.</h2>
        )}
      </div>

      {loadingResumes && (
          <div className="flex flex-col items-center justify-center">
            <img src="/images/resume-scan-2.gif" className="w-[200px]" />
          </div>
      )}

      {!loadingResumes && resumes.length > 0 && (
        <>
          <div className="resumes-section">
            {resumes.map((resume) => (
                <ResumeCard key={resume.id} resume={resume} />
            ))}
          </div>

          {/* Wipe Data Button */}
          <div className="flex justify-center mt-8 w-full">
            <button
              onClick={handleWipeData}
              disabled={isWiping}
              className="flex items-center gap-2 bg-red-500 hover:bg-red-600 text-white font-semibold py-3 px-6 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isWiping ? (
                <>
                  <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Wiping Data...
                </>
              ) : (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  Clear All Data
                </>
              )}
            </button>
          </div>
        </>
      )}

      {!loadingResumes && resumes?.length === 0 && (
          <div className="flex flex-col items-center justify-center mt-10 gap-4">
            <Link to="/upload" className="primary-button w-fit text-xl font-semibold">
              Upload Resume
            </Link>
          </div>
      )}
    </section>
  </main>
}