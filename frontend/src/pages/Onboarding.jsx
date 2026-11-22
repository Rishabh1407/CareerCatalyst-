import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { profileService } from '../services/api';
import {
  GraduationCap,
  Briefcase,
  Target,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Loader2,
  Sparkles,
  Layers,
  BookOpen
} from 'lucide-react';

const Onboarding = () => {
  const { profile, refreshProfile } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [isSaving, setIsSaving] = useState(false);

  const [formData, setFormData] = useState({
    full_name: '',
    college: '',
    degree: '',
    specialization: '',
    current_year: '',
    graduation_year: '',
    technical_skills: '',
    programming_languages: '',
    projects: '',
    internships: '',
    certifications: '',
    achievements: '',
    work_experience: '',
    target_role: '',
    target_company: '',
    job_description: '',
    interview_type: 'Comprehensive'
  });

  useEffect(() => {
    if (profile) {
      setFormData((prev) => ({
        ...prev,
        full_name: profile.full_name || '',
        college: profile.college || '',
        degree: profile.degree || '',
        specialization: profile.specialization || '',
        current_year: profile.current_year || '',
        graduation_year: profile.graduation_year || '',
        technical_skills: profile.technical_skills || '',
        programming_languages: profile.programming_languages || '',
        projects: profile.projects || '',
        internships: profile.internships || '',
        certifications: profile.certifications || '',
        achievements: profile.achievements || '',
        work_experience: profile.work_experience || '',
        target_role: profile.target_role || '',
        target_company: profile.target_company || '',
        job_description: profile.job_description || '',
        interview_type: profile.interview_type || 'Comprehensive'
      }));
    }
  }, [profile]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleNext = (e) => {
    if (e) e.preventDefault();
    setStep((prev) => Math.min(prev + 1, 3));
  };

  const handleBack = () => {
    setStep((prev) => Math.max(prev - 1, 1));
  };

  const handleFinish = async (e) => {
    if (e) e.preventDefault();
    setIsSaving(true);
    try {
      await profileService.updateProfile(formData);
      await refreshProfile();
      showToast('Profile configured successfully!', 'success');
      navigate('/dashboard');
    } catch (err) {
      showToast(err.response?.data?.detail || 'Failed to save profile. Please try again.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-xs font-semibold uppercase tracking-wider mb-2">
            <Sparkles className="w-3.5 h-3.5" /> Candidate Onboarding
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Set Up Your Candidate Profile</h1>
          <p className="text-slate-500 text-sm mt-1 max-w-lg mx-auto">
            CareerCatalyst tailors interview questions specifically to your background. Provide as much or as little as you have.
          </p>
        </div>

        {/* Steps Progress */}
        <div className="bg-white rounded-2xl p-4 shadow-xs border border-slate-200/80 mb-8">
          <div className="flex items-center justify-between">
            <div className={`flex items-center gap-2.5 ${step >= 1 ? 'text-blue-600 font-bold' : 'text-slate-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                step > 1 ? 'bg-emerald-500 text-white' : step === 1 ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-400'
              }`}>
                {step > 1 ? <CheckCircle2 className="w-4 h-4" /> : '1'}
              </div>
              <span className="text-xs sm:text-sm">Education</span>
            </div>

            <div className="h-0.5 flex-1 mx-3 bg-slate-200">
              <div className={`h-full bg-blue-600 transition-all ${step >= 2 ? 'w-full' : 'w-0'}`} />
            </div>

            <div className={`flex items-center gap-2.5 ${step >= 2 ? 'text-blue-600 font-bold' : 'text-slate-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                step > 2 ? 'bg-emerald-500 text-white' : step === 2 ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-400'
              }`}>
                {step > 2 ? <CheckCircle2 className="w-4 h-4" /> : '2'}
              </div>
              <span className="text-xs sm:text-sm">Skills & Projects</span>
            </div>

            <div className="h-0.5 flex-1 mx-3 bg-slate-200">
              <div className={`h-full bg-blue-600 transition-all ${step >= 3 ? 'w-full' : 'w-0'}`} />
            </div>

            <div className={`flex items-center gap-2.5 ${step >= 3 ? 'text-blue-600 font-bold' : 'text-slate-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                step === 3 ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-400'
              }`}>
                3
              </div>
              <span className="text-xs sm:text-sm">Target Role</span>
            </div>
          </div>
        </div>

        {/* Form Container */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 sm:p-8">
          {step === 1 && (
            <div className="space-y-5 animate-fade-in">
              <div className="border-b border-slate-100 pb-3">
                <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <GraduationCap className="w-5 h-5 text-blue-600" />
                  Personal & Academic Information
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">Let interviewers know where you studied and your degree status.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name</label>
                  <input
                    type="text"
                    name="full_name"
                    value={formData.full_name}
                    onChange={handleChange}
                    placeholder="e.g. Alex Chen"
                    className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">College / University</label>
                  <input
                    type="text"
                    name="college"
                    value={formData.college}
                    onChange={handleChange}
                    placeholder="e.g. Stanford University or Delhi Tech University"
                    className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Degree</label>
                  <input
                    type="text"
                    name="degree"
                    value={formData.degree}
                    onChange={handleChange}
                    placeholder="e.g. Bachelor of Science / B.Tech / M.S."
                    className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Major / Specialization</label>
                  <input
                    type="text"
                    name="specialization"
                    value={formData.specialization}
                    onChange={handleChange}
                    placeholder="e.g. Computer Science & AI"
                    className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Current Year / Semester</label>
                  <input
                    type="text"
                    name="current_year"
                    value={formData.current_year}
                    onChange={handleChange}
                    placeholder="e.g. 4th Year / Final Semester / Graduated"
                    className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Graduation Year</label>
                  <input
                    type="text"
                    name="graduation_year"
                    value={formData.graduation_year}
                    onChange={handleChange}
                    placeholder="e.g. 2025"
                    className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  />
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-5 animate-fade-in">
              <div className="border-b border-slate-100 pb-3">
                <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <Briefcase className="w-5 h-5 text-blue-600" />
                  Skills, Projects & Experience
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  AI uses this data so technical and project questions match your actual achievements.
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Programming Languages (comma separated)
                  </label>
                  <input
                    type="text"
                    name="programming_languages"
                    value={formData.programming_languages}
                    onChange={handleChange}
                    placeholder="e.g. Python, JavaScript, TypeScript, C++, Java, SQL"
                    className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Technical Skills & Frameworks (comma separated)
                  </label>
                  <input
                    type="text"
                    name="technical_skills"
                    value={formData.technical_skills}
                    onChange={handleChange}
                    placeholder="e.g. React, Node.js, FastAPI, PostgreSQL, Docker, Git, REST APIs, System Design"
                    className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Key Projects (Title, Tech Stack & What you built)
                  </label>
                  <textarea
                    rows={4}
                    name="projects"
                    value={formData.projects}
                    onChange={handleChange}
                    placeholder="e.g. 1) E-Commerce Backend: Built FastAPI microservice with PostgreSQL and Redis caching. Handled 500 req/sec.&#10;2) Task Tracker: React SPA with drag-and-drop state management."
                    className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Internships / Experience</label>
                    <textarea
                      rows={2}
                      name="internships"
                      value={formData.internships}
                      onChange={handleChange}
                      placeholder="e.g. Software Intern at Acme Labs (Summer 2024): Automated testing pipelines."
                      className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Certifications & Awards</label>
                    <textarea
                      rows={2}
                      name="certifications"
                      value={formData.certifications}
                      onChange={handleChange}
                      placeholder="e.g. AWS Certified Cloud Practitioner, 1st place in University Hackathon."
                      className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-5 animate-fade-in">
              <div className="border-b border-slate-100 pb-3">
                <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <Target className="w-5 h-5 text-blue-600" />
                  Target Role & Interview Preferences
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">Tell us the job role and company you are preparing for.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Target Job Role</label>
                  <input
                    type="text"
                    name="target_role"
                    value={formData.target_role}
                    onChange={handleChange}
                    placeholder="e.g. Full-Stack Developer or Junior Backend Engineer"
                    className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Target Company</label>
                  <input
                    type="text"
                    name="target_company"
                    value={formData.target_company}
                    onChange={handleChange}
                    placeholder="e.g. Google, Stripe, or High-Growth Startup"
                    className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Interview Type Preference</label>
                  <select
                    name="interview_type"
                    value={formData.interview_type}
                    onChange={handleChange}
                    className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  >
                    <option value="Comprehensive">Comprehensive (Self-Intro, HR, Tech, Projects, Role)</option>
                    <option value="Technical Focused">Technical & Architecture Focused</option>
                    <option value="HR & Behavioral">HR, Behavioral & Leadership Focused</option>
                    <option value="Company Specific">Company Domain & Cultural Alignment</option>
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Job Description / Requirements (Optional)
                  </label>
                  <textarea
                    rows={4}
                    name="job_description"
                    value={formData.job_description}
                    onChange={handleChange}
                    placeholder="Paste job posting snippet or key expectations here if available..."
                    className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex items-center justify-between pt-6 mt-6 border-t border-slate-100">
            {step > 1 ? (
              <button
                type="button"
                onClick={handleBack}
                className="px-4 py-2 text-sm font-semibold text-slate-600 hover:text-slate-900 flex items-center gap-1.5 transition"
              >
                <ArrowLeft className="w-4 h-4" /> Previous
              </button>
            ) : (
              <button
                type="button"
                onClick={() => navigate('/dashboard')}
                className="px-4 py-2 text-sm font-semibold text-slate-400 hover:text-slate-600 transition"
              >
                Skip for now
              </button>
            )}

            {step < 3 ? (
              <button
                type="button"
                onClick={handleNext}
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold flex items-center gap-2 shadow-xs transition"
              >
                Continue <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                disabled={isSaving}
                onClick={handleFinish}
                className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl text-sm font-semibold flex items-center gap-2 shadow-md shadow-blue-500/20 transition disabled:opacity-70"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Saving...
                  </>
                ) : (
                  <>
                    Complete & Go to Dashboard <CheckCircle2 className="w-4 h-4" />
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Onboarding;
