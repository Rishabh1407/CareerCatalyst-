import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { profileService } from '../services/api';
import {
  User,
  GraduationCap,
  Briefcase,
  Target,
  Save,
  Loader2,
  CheckCircle2,
  Sparkles,
  Info
} from 'lucide-react';

const Profile = () => {
  const { profile, refreshProfile } = useAuth();
  const { showToast } = useToast();

  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
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

  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('all');

  useEffect(() => {
    if (profile) {
      setFormData({
        full_name: profile.full_name || '',
        email: profile.email || '',
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
      });
    }
  }, [profile]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await profileService.updateProfile(formData);
      await refreshProfile();
      showToast('Profile updated successfully!', 'success');
    } catch (err) {
      showToast(err.response?.data?.detail || 'Failed to update profile.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const completion = profile?.completion_percentage || 0;

  return (
    <div className="space-y-6 max-w-5xl mx-auto animate-fade-in pb-12">
      {/* Header and Completion Card */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <User className="w-5 h-5 text-blue-600" />
            Candidate Profile Management
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Keep your academic background, verified technical skills, and target career preferences up to date.
          </p>
        </div>

        <div className="flex items-center gap-4 shrink-0">
          <div className="text-right">
            <p className="text-xs font-semibold text-slate-500">Profile Strength</p>
            <p className="text-xl font-black text-blue-600">{completion}%</p>
          </div>
          <div className="w-24 bg-slate-100 rounded-full h-3 overflow-hidden">
            <div
              className="bg-blue-600 h-3 rounded-full transition-all duration-500"
              style={{ width: `${completion}%` }}
            />
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* SECTION 1: Personal & Educational */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-4">
          <div className="border-b border-slate-100 pb-3 flex items-center gap-2">
            <GraduationCap className="w-5 h-5 text-indigo-600" />
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              1. Personal & Educational Information
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-1">
              <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name</label>
              <input
                type="text"
                name="full_name"
                value={formData.full_name}
                onChange={handleChange}
                placeholder="e.g. Jordan Rivera"
                className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
              />
            </div>

            <div className="lg:col-span-1">
              <label className="block text-xs font-semibold text-slate-700 mb-1">Contact Email</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="contact@domain.com"
                className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
              />
            </div>

            <div className="lg:col-span-1">
              <label className="block text-xs font-semibold text-slate-700 mb-1">College / University</label>
              <input
                type="text"
                name="college"
                value={formData.college}
                onChange={handleChange}
                placeholder="e.g. University of California, Berkeley"
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
                placeholder="e.g. B.Tech / B.S. / M.S. / BCA"
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
                placeholder="e.g. Computer Science, Information Technology"
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
                placeholder="e.g. 4th Year / 8th Semester / Graduated"
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

        {/* SECTION 2: Professional Information */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-4">
          <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Briefcase className="w-5 h-5 text-blue-600" />
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                2. Professional Skills & Portfolio
              </h2>
            </div>
            <span className="text-[11px] text-slate-400">Strictly no invented achievements</span>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Programming Languages (comma separated)
                </label>
                <input
                  type="text"
                  name="programming_languages"
                  value={formData.programming_languages}
                  onChange={handleChange}
                  placeholder="e.g. Python, JavaScript, TypeScript, Go, Java, C#"
                  className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Technical Skills & Tools (comma separated)
                </label>
                <input
                  type="text"
                  name="technical_skills"
                  value={formData.technical_skills}
                  onChange={handleChange}
                  placeholder="e.g. React, Node.js, FastAPI, PostgreSQL, Docker, Git, RESTful APIs"
                  className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Real Projects (Architecture, Tech Stack, Key Features & Contribution)
              </label>
              <textarea
                rows={4}
                name="projects"
                value={formData.projects}
                onChange={handleChange}
                placeholder="Describe your actual software projects in detail. The AI generator creates project architecture and trade-off interview questions directly from this section."
                className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Internships</label>
                <textarea
                  rows={2}
                  name="internships"
                  value={formData.internships}
                  onChange={handleChange}
                  placeholder="Company name, role, responsibilities, and achievements..."
                  className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Certifications</label>
                <textarea
                  rows={2}
                  name="certifications"
                  value={formData.certifications}
                  onChange={handleChange}
                  placeholder="e.g. AWS Certified Developer, HashiCorp Certified Terraform Associate..."
                  className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Achievements & Hackathons</label>
                <textarea
                  rows={2}
                  name="achievements"
                  value={formData.achievements}
                  onChange={handleChange}
                  placeholder="Competitions won, open source PRs merged, academic awards..."
                  className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Prior Work Experience (Optional)
                </label>
                <textarea
                  rows={2}
                  name="work_experience"
                  value={formData.work_experience}
                  onChange={handleChange}
                  placeholder="Previous full-time or contract roles if applicable..."
                  className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                />
              </div>
            </div>
          </div>
        </div>

        {/* SECTION 3: Career Preferences */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-4">
          <div className="border-b border-slate-100 pb-3 flex items-center gap-2">
            <Target className="w-5 h-5 text-emerald-600" />
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              3. Target Career Preferences
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Target Job Role</label>
              <input
                type="text"
                name="target_role"
                value={formData.target_role}
                onChange={handleChange}
                placeholder="e.g. Junior Full-Stack Developer or Software Engineer I"
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
                placeholder="e.g. Microsoft, Shopify, or FinTech Startup"
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
                <option value="Technical Focused">Technical Focused (Coding, System Architecture, Algorithms)</option>
                <option value="HR & Behavioral">HR & Behavioral (STAR Method, Teamwork, Leadership)</option>
                <option value="Company Specific">Company Domain & Cultural Alignment</option>
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Target Job Description (Optional)
              </label>
              <textarea
                rows={3}
                name="job_description"
                value={formData.job_description}
                onChange={handleChange}
                placeholder="Paste key responsibilities or tech stack requirements from a specific job posting..."
                className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
              />
            </div>
          </div>
        </div>

        {/* Action Button */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="submit"
            disabled={isSaving}
            className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold rounded-xl text-sm shadow-md shadow-blue-500/20 flex items-center gap-2 transition disabled:opacity-70"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Saving Changes...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" /> Save Profile Details
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default Profile;
