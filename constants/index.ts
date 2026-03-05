export const MAX_UPLOAD_SIZE_BYTES = 25 * 1024 * 1024;

type AtsTip = {
    type: "good" | "improve";
    tip: string;
};

type DetailedTip = {
    type: "good" | "improve";
    tip: string;
    explanation: string;
};

type DemoFeedback = {
    overallScore: number;
    ATS: {
        score: number;
        tips: AtsTip[];
    };
    toneAndStyle: {
        score: number;
        tips: DetailedTip[];
    };
    content: {
        score: number;
        tips: DetailedTip[];
    };
    structure: {
        score: number;
        tips: DetailedTip[];
    };
    skills: {
        score: number;
        tips: DetailedTip[];
    };
};

type DemoResume = {
    id: string;
    companyName: string;
    jobTitle: string;
    imagePath: string;
    resumePath: string;
    feedback: DemoFeedback;
};

export const resumes: DemoResume[] = [
    {
        id: "1",
        companyName: "Google",
        jobTitle: "Frontend Developer",
        imagePath: "/images/resume_01.png",
        resumePath: "",
        feedback: {
            overallScore: 87,
            ATS: {
                score: 85,
                tips: [{ type: "improve", tip: "Use exact keywords from the job description." }],
            },
            toneAndStyle: {
                score: 92,
                tips: [{ type: "good", tip: "Strong and concise bullet phrasing.", explanation: "Most bullets are direct and avoid filler language." }],
            },
            content: {
                score: 86,
                tips: [{ type: "improve", tip: "Add measurable impact to two recent bullets.", explanation: "Add metrics like conversion gains, load-time reductions, or team impact." }],
            },
            structure: {
                score: 88,
                tips: [{ type: "good", tip: "Section order is recruiter-friendly.", explanation: "Experience and skills are easy to find in the first screen view." }],
            },
            skills: {
                score: 84,
                tips: [{ type: "improve", tip: "Group skills by frontend, tooling, and testing.", explanation: "A grouped skills section improves ATS parsing and scanning speed." }],
            },
        },
    },
    {
        id: "2",
        companyName: "Microsoft",
        jobTitle: "Cloud Engineer",
        imagePath: "/images/resume_02.png",
        resumePath: "",
        feedback: {
            overallScore: 62,
            ATS: {
                score: 58,
                tips: [{ type: "improve", tip: "Increase role-specific cloud platform terminology." }],
            },
            toneAndStyle: {
                score: 74,
                tips: [{ type: "good", tip: "Professional tone throughout.", explanation: "Writing remains consistent and avoids overly casual phrasing." }],
            },
            content: {
                score: 60,
                tips: [{ type: "improve", tip: "Quantify infrastructure scale and cost savings.", explanation: "Include workload scale, uptime impact, and dollar savings where possible." }],
            },
            structure: {
                score: 64,
                tips: [{ type: "improve", tip: "Move certifications above projects.", explanation: "Cloud role screeners often prioritize certifications during initial review." }],
            },
            skills: {
                score: 68,
                tips: [{ type: "good", tip: "Good breadth across DevOps tooling.", explanation: "Tool coverage spans deployment, monitoring, and CI/CD." }],
            },
        },
    },
    {
        id: "3",
        companyName: "Apple",
        jobTitle: "iOS Developer",
        imagePath: "/images/resume_03.png",
        resumePath: "",
        feedback: {
            overallScore: 79,
            ATS: {
                score: 77,
                tips: [{ type: "improve", tip: "Add SwiftUI and accessibility terms in experience bullets." }],
            },
            toneAndStyle: {
                score: 83,
                tips: [{ type: "good", tip: "Clear and concise writing style.", explanation: "Descriptions are concise and mostly focused on delivered outcomes." }],
            },
            content: {
                score: 78,
                tips: [{ type: "improve", tip: "Highlight shipped features with usage metrics.", explanation: "Add MAU, retention, crash rate, or release velocity for shipped features." }],
            },
            structure: {
                score: 82,
                tips: [{ type: "good", tip: "Readable section hierarchy and spacing.", explanation: "Consistent section spacing improves readability for hiring teams." }],
            },
            skills: {
                score: 80,
                tips: [{ type: "good", tip: "Strong platform-specific skills coverage.", explanation: "The profile includes modern iOS technologies and relevant frameworks." }],
            },
        },
    },
];

export const AIResponseFormat = `
      interface Feedback {
      overallScore: number; //max 100
      ATS: {
        score: number; //rate based on ATS suitability
        tips: {
          type: "good" | "improve";
          tip: string; //give 3-4 tips
        }[];
      };
      toneAndStyle: {
        score: number; //max 100
        tips: {
          type: "good" | "improve";
          tip: string; //make it a short "title" for the actual explanation
          explanation: string; //explain in detail here
        }[]; //give 3-4 tips
      };
      content: {
        score: number; //max 100
        tips: {
          type: "good" | "improve";
          tip: string; //make it a short "title" for the actual explanation
          explanation: string; //explain in detail here
        }[]; //give 3-4 tips
      };
      structure: {
        score: number; //max 100
        tips: {
          type: "good" | "improve";
          tip: string; //make it a short "title" for the actual explanation
          explanation: string; //explain in detail here
        }[]; //give 3-4 tips
      };
      skills: {
        score: number; //max 100
        tips: {
          type: "good" | "improve";
          tip: string; //make it a short "title" for the actual explanation
          explanation: string; //explain in detail here
        }[]; //give 3-4 tips
      };
    }`;

export const prepareInstructions = ({
                                        jobTitle,
                                        jobDescription,
                                    }: {
    jobTitle: string;
    jobDescription: string;
}) =>
    `You are an expert in ATS (Applicant Tracking System) and resume analysis.
  Please analyze and rate this resume and suggest how to improve it.
  The rating can be low if the resume is bad.
  Be thorough and detailed. Don't be afraid to point out any mistakes or areas for improvement.
  If there is a lot to improve, don't hesitate to give low scores. This is to help the user to improve their resume.
  If available, use the job description for the job user is applying to to give more detailed feedback.
  If provided, take the job description into consideration.
  The job title is: ${jobTitle}
  The job description is: ${jobDescription}
  Provide the feedback using the following format: ${AIResponseFormat}
  Return the analysis as a JSON object, without any other text and without the backticks.
  Do not include any other text or comments.`;
