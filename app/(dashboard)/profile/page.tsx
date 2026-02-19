'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { useState } from 'react';
import {
    User, Mail, Phone, MapPin, Building2, GraduationCap,
    Calendar, Shield, Bell, Key, LogOut, ChevronRight,
    Camera, Edit3, CheckCircle, Globe, Clock
} from 'lucide-react';

// Mock user data
const USER_DATA = {
    name: "Alex Andersson",
    email: "alex.andersson@student.kth.se",
    phone: "+46 70 123 4567",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Alex",
    university: "KTH Royal Institute of Technology",
    program: "Master in Engineering Physics",
    studentId: "STU-2024-78542",
    studyYear: "Årskurs 2",
    joinDate: "September 2024",
    timezone: "Europa/Stockholm",
    language: "Svenska",
    verified: true,
    subscription: {
        plan: "Student Pro",
        status: "Aktiv",
        renewDate: "1 Feb, 2026"
    },
    stats: {
        coursesEnrolled: 4,
        hoursStudied: 127,
        questionsAnswered: 1842,
        achievementsUnlocked: 12
    }
};

export default function ProfilePage() {
    const [activeTab, setActiveTab] = useState('profile');

    return (
        <div className="max-w-4xl mx-auto px-4 py-8">

            {/* Profile Header */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white dark:bg-zinc-900 rounded-2xl p-6 border border-zinc-200 dark:border-zinc-800 mb-6"
            >
                <div className="flex flex-col md:flex-row gap-6 items-center md:items-start">
                    {/* Avatar */}
                    <div className="relative group">
                        <div className="w-28 h-28 rounded-full overflow-hidden border-4 border-white dark:border-zinc-800 shadow-xl">
                            <img src={USER_DATA.avatar} alt="Profile" className="w-full h-full object-cover" />
                        </div>
                        <button className="absolute bottom-0 right-0 p-2 bg-blue-600 hover:bg-blue-500 text-white rounded-full shadow-lg transition-all">
                            <Camera className="w-4 h-4" />
                        </button>
                    </div>

                    {/* Info */}
                    <div className="flex-1 text-center md:text-left">
                        <div className="flex items-center gap-2 justify-center md:justify-start mb-1">
                            <h1 className="text-2xl font-bold">{USER_DATA.name}</h1>
                            {USER_DATA.verified && (
                                <CheckCircle className="w-5 h-5 text-blue-500" />
                            )}
                        </div>
                        <p className="text-zinc-500 mb-2">{USER_DATA.email}</p>
                        <div className="flex flex-wrap gap-2 justify-center md:justify-start">
                            <span className="px-3 py-1 bg-purple-100 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 text-sm font-medium rounded-full">
                                {USER_DATA.subscription.plan}
                            </span>
                            <span className="px-3 py-1 bg-green-100 dark:bg-green-900/20 text-green-600 dark:text-green-400 text-sm font-medium rounded-full">
                                {USER_DATA.subscription.status}
                            </span>
                        </div>
                    </div>

                    {/* Edit Button */}
                    <button className="px-4 py-2 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm font-medium transition-all flex items-center gap-2">
                        <Edit3 className="w-4 h-4" />
                        Redigera profil
                    </button>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-6 border-t border-zinc-100 dark:border-zinc-800">
                    <div className="text-center">
                        <div className="text-2xl font-bold text-blue-600">{USER_DATA.stats.coursesEnrolled}</div>
                        <div className="text-sm text-zinc-500">Kurser</div>
                    </div>
                    <div className="text-center">
                        <div className="text-2xl font-bold text-green-600">{USER_DATA.stats.hoursStudied}h</div>
                        <div className="text-sm text-zinc-500">Studerat</div>
                    </div>
                    <div className="text-center">
                        <div className="text-2xl font-bold text-purple-600">{USER_DATA.stats.questionsAnswered}</div>
                        <div className="text-sm text-zinc-500">Frågor</div>
                    </div>
                    <div className="text-center">
                        <div className="text-2xl font-bold text-orange-600">{USER_DATA.stats.achievementsUnlocked}</div>
                        <div className="text-sm text-zinc-500">Utmärkelser</div>
                    </div>
                </div>
            </motion.div>

            {/* Tabs */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="flex gap-2 mb-6"
            >
                <button
                    onClick={() => setActiveTab('profile')}
                    className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${activeTab === 'profile'
                        ? 'bg-blue-600 text-white'
                        : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700'
                        }`}
                >
                    Personlig info
                </button>
                <button
                    onClick={() => setActiveTab('academic')}
                    className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${activeTab === 'academic'
                        ? 'bg-blue-600 text-white'
                        : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700'
                        }`}
                >
                    Akademisk
                </button>
                <button
                    onClick={() => setActiveTab('security')}
                    className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${activeTab === 'security'
                        ? 'bg-blue-600 text-white'
                        : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700'
                        }`}
                >
                    Säkerhet
                </button>
            </motion.div>

            {/* Content based on tab */}
            {activeTab === 'profile' && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="space-y-4"
                >
                    <div className="bg-white dark:bg-zinc-900 rounded-2xl p-6 border border-zinc-200 dark:border-zinc-800">
                        <h2 className="font-bold mb-4">Personlig information</h2>
                        <div className="space-y-4">
                            <InfoRow icon={<User className="w-5 h-5" />} label="Fullständigt namn" value={USER_DATA.name} />
                            <InfoRow icon={<Mail className="w-5 h-5" />} label="E-post" value={USER_DATA.email} verified />
                            <InfoRow icon={<Phone className="w-5 h-5" />} label="Telefon" value={USER_DATA.phone} />
                            <InfoRow icon={<Globe className="w-5 h-5" />} label="Språk" value={USER_DATA.language} />
                            <InfoRow icon={<Clock className="w-5 h-5" />} label="Tidszon" value={USER_DATA.timezone} />
                        </div>
                    </div>

                    <div className="bg-white dark:bg-zinc-900 rounded-2xl p-6 border border-zinc-200 dark:border-zinc-800">
                        <h2 className="font-bold mb-4">Prenumeration</h2>
                        <div className="flex items-center justify-between p-4 bg-gradient-to-r from-purple-100 to-blue-100 dark:from-purple-900/20 dark:to-blue-900/20 rounded-xl border border-purple-200 dark:border-purple-800/30">
                            <div>
                                <div className="font-bold text-purple-700 dark:text-purple-300">{USER_DATA.subscription.plan}</div>
                                <div className="text-sm text-zinc-500">Förnyas {USER_DATA.subscription.renewDate}</div>
                            </div>
                            <Link href="/pricing" className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-sm font-medium transition-all">
                                Hantera plan
                            </Link>
                        </div>
                    </div>
                </motion.div>
            )}

            {activeTab === 'academic' && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="space-y-4"
                >
                    <div className="bg-white dark:bg-zinc-900 rounded-2xl p-6 border border-zinc-200 dark:border-zinc-800">
                        <h2 className="font-bold mb-4">Akademisk information</h2>
                        <div className="space-y-4">
                            <InfoRow icon={<Building2 className="w-5 h-5" />} label="Universitet" value={USER_DATA.university} />
                            <InfoRow icon={<GraduationCap className="w-5 h-5" />} label="Program" value={USER_DATA.program} />
                            <InfoRow icon={<User className="w-5 h-5" />} label="Student-ID" value={USER_DATA.studentId} />
                            <InfoRow icon={<Calendar className="w-5 h-5" />} label="Studieår" value={USER_DATA.studyYear} />
                            <InfoRow icon={<Calendar className="w-5 h-5" />} label="Medlem sedan" value={USER_DATA.joinDate} />
                        </div>
                    </div>

                    <div className="bg-white dark:bg-zinc-900 rounded-2xl p-6 border border-zinc-200 dark:border-zinc-800">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="font-bold">Registrerade kurser</h2>
                            <Link href="/courses" className="text-sm text-blue-600 hover:underline">Visa alla</Link>
                        </div>
                        <div className="space-y-3">
                            {['Calculus I (SF1625)', 'Linear Algebra (SF1624)', 'Mechanics (SG1113)', 'Calculus II (SF1626)'].map((course, i) => (
                                <div key={i} className="flex items-center justify-between p-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl">
                                    <span>{course}</span>
                                    <ChevronRight className="w-4 h-4 text-zinc-400" />
                                </div>
                            ))}
                        </div>
                    </div>
                </motion.div>
            )}

            {activeTab === 'security' && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="space-y-4"
                >
                    <div className="bg-white dark:bg-zinc-900 rounded-2xl p-6 border border-zinc-200 dark:border-zinc-800">
                        <h2 className="font-bold mb-4">Säkerhetsinställningar</h2>
                        <div className="space-y-4">
                            <SecurityRow
                                icon={<Key className="w-5 h-5" />}
                                title="Lösenord"
                                description="Senast ändrat för 3 månader sedan"
                                action="Ändra"
                            />
                            <SecurityRow
                                icon={<Shield className="w-5 h-5" />}
                                title="Tvåfaktorsautentisering"
                                description="Ej aktiverad"
                                action="Aktivera"
                            />
                            <SecurityRow
                                icon={<Bell className="w-5 h-5" />}
                                title="Inloggningsnotiser"
                                description="Mejlnotiser vid nya inloggningar"
                                action="Hantera"
                            />
                        </div>
                    </div>

                    <div className="bg-white dark:bg-zinc-900 rounded-2xl p-6 border border-zinc-200 dark:border-zinc-800">
                        <h2 className="font-bold mb-4">Kopplade konton</h2>
                        <div className="space-y-3">
                            <div className="flex items-center justify-between p-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                                        <span className="text-blue-600 font-bold text-sm">G</span>
                                    </div>
                                    <span>Google</span>
                                </div>
                                <span className="text-sm text-green-600">Ansluten</span>
                            </div>
                            <div className="flex items-center justify-between p-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 bg-zinc-800 dark:bg-zinc-700 rounded-lg flex items-center justify-center">
                                        <span className="text-white font-bold text-sm">GH</span>
                                    </div>
                                    <span>GitHub</span>
                                </div>
                                <button className="text-sm text-blue-600 hover:underline">Anslut</button>
                            </div>
                        </div>
                    </div>

                    <div className="p-6 bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-900/30 rounded-2xl">
                        <h3 className="font-bold text-red-600 mb-2">Riskzon</h3>
                        <p className="text-sm text-zinc-500 mb-4">Radera ditt konto och all tillhörande data permanent.</p>
                        <button className="px-4 py-2 bg-red-100 dark:bg-red-900/20 hover:bg-red-200 dark:hover:bg-red-900/30 text-red-600 border border-red-200 dark:border-red-800 rounded-lg text-sm font-medium transition-all">
                            Radera konto
                        </button>
                    </div>
                </motion.div>
            )}

        </div>
    );
}

// Helper Components
function InfoRow({ icon, label, value, verified = false }: { icon: React.ReactNode, label: string, value: string, verified?: boolean }) {
    return (
        <div className="flex items-center justify-between py-3 border-b border-zinc-100 dark:border-zinc-800 last:border-0">
            <div className="flex items-center gap-3 text-zinc-500">
                {icon}
                <span className="text-sm">{label}</span>
            </div>
            <div className="flex items-center gap-2">
                <span className="font-medium">{value}</span>
                {verified && <CheckCircle className="w-4 h-4 text-green-500" />}
            </div>
        </div>
    )
}

function SecurityRow({ icon, title, description, action }: { icon: React.ReactNode, title: string, description: string, action: string }) {
    return (
        <div className="flex items-center justify-between py-3 border-b border-zinc-100 dark:border-zinc-800 last:border-0">
            <div className="flex items-center gap-3">
                <div className="p-2 bg-zinc-100 dark:bg-zinc-800 rounded-lg text-zinc-500">
                    {icon}
                </div>
                <div>
                    <div className="font-medium">{title}</div>
                    <div className="text-sm text-zinc-500">{description}</div>
                </div>
            </div>
            <button className="text-sm text-blue-600 hover:underline font-medium">
                {action}
            </button>
        </div>
    )
}
