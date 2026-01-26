'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Header } from '@/components/Header';
import {
    Mail, MapPin, Phone, Clock, Send, MessageSquare,
    Building2, Users, ArrowRight
} from 'lucide-react';
import { useState } from 'react';

export default function ContactPage() {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        subject: '',
        message: '',
        type: 'general'
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        alert('Message sent! We\'ll get back to you soon.');
    };

    return (
        <main className="min-h-screen bg-white dark:bg-black text-zinc-900 dark:text-white">
            <Header />

            <section className="pt-32 pb-24 px-4">
                <div className="max-w-6xl mx-auto">
                    {/* Header */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-center mb-16"
                    >
                        <h1 className="text-5xl font-bold mb-4">Get in Touch</h1>
                        <p className="text-xl text-zinc-600 dark:text-zinc-400 max-w-2xl mx-auto">
                            Have questions? We'd love to hear from you. Send us a message and we'll respond as soon as possible.
                        </p>
                    </motion.div>

                    <div className="grid lg:grid-cols-3 gap-12">
                        {/* Contact Info */}
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.1 }}
                            className="space-y-6"
                        >
                            <div className="p-6 bg-zinc-50 dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800">
                                <Mail className="w-8 h-8 text-blue-500 mb-4" />
                                <h3 className="font-bold mb-2">Email Us</h3>
                                <p className="text-zinc-600 dark:text-zinc-400 text-sm mb-2">For general inquiries</p>
                                <a href="mailto:hello@qmath.com" className="text-blue-600 hover:underline">
                                    hello@qmath.com
                                </a>
                            </div>

                            <div className="p-6 bg-zinc-50 dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800">
                                <Building2 className="w-8 h-8 text-purple-500 mb-4" />
                                <h3 className="font-bold mb-2">For Universities</h3>
                                <p className="text-zinc-600 dark:text-zinc-400 text-sm mb-2">Enterprise partnerships</p>
                                <a href="mailto:enterprise@qmath.com" className="text-blue-600 hover:underline">
                                    enterprise@qmath.com
                                </a>
                            </div>

                            <div className="p-6 bg-zinc-50 dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800">
                                <MapPin className="w-8 h-8 text-green-500 mb-4" />
                                <h3 className="font-bold mb-2">Office</h3>
                                <p className="text-zinc-600 dark:text-zinc-400 text-sm">
                                    Qmath EdTech AB<br />
                                    Drottning Kristinas väg 25<br />
                                    114 28 Stockholm, Sweden
                                </p>
                            </div>

                            <div className="p-6 bg-zinc-50 dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800">
                                <Clock className="w-8 h-8 text-orange-500 mb-4" />
                                <h3 className="font-bold mb-2">Response Time</h3>
                                <p className="text-zinc-600 dark:text-zinc-400 text-sm">
                                    We typically respond within 24 hours during business days.
                                </p>
                            </div>
                        </motion.div>

                        {/* Contact Form */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                            className="lg:col-span-2"
                        >
                            <form onSubmit={handleSubmit} className="bg-zinc-50 dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-8">
                                <h2 className="text-2xl font-bold mb-6">Send us a message</h2>

                                {/* Inquiry Type */}
                                <div className="grid grid-cols-3 gap-4 mb-6">
                                    {[
                                        { id: 'general', label: 'General', icon: MessageSquare },
                                        { id: 'sales', label: 'Sales', icon: Building2 },
                                        { id: 'support', label: 'Support', icon: Users }
                                    ].map((type) => (
                                        <button
                                            key={type.id}
                                            type="button"
                                            onClick={() => setFormData({ ...formData, type: type.id })}
                                            className={`p-4 rounded-xl border text-center transition-all ${formData.type === type.id
                                                ? 'bg-blue-50 dark:bg-blue-500/10 border-blue-500 text-blue-600 dark:text-blue-400'
                                                : 'bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700'
                                                }`}
                                        >
                                            <type.icon className="w-5 h-5 mx-auto mb-2" />
                                            <span className="text-sm font-medium">{type.label}</span>
                                        </button>
                                    ))}
                                </div>

                                <div className="grid md:grid-cols-2 gap-4 mb-4">
                                    <div>
                                        <label className="block text-sm font-medium mb-2">Name</label>
                                        <input
                                            type="text"
                                            required
                                            placeholder="Your name"
                                            className="w-full px-4 py-3 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:ring-2 focus:ring-blue-500 outline-none"
                                            value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium mb-2">Email</label>
                                        <input
                                            type="email"
                                            required
                                            placeholder="your@email.com"
                                            className="w-full px-4 py-3 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:ring-2 focus:ring-blue-500 outline-none"
                                            value={formData.email}
                                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div className="mb-4">
                                    <label className="block text-sm font-medium mb-2">Subject</label>
                                    <input
                                        type="text"
                                        required
                                        placeholder="How can we help?"
                                        className="w-full px-4 py-3 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:ring-2 focus:ring-blue-500 outline-none"
                                        value={formData.subject}
                                        onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                                    />
                                </div>

                                <div className="mb-6">
                                    <label className="block text-sm font-medium mb-2">Message</label>
                                    <textarea
                                        required
                                        rows={5}
                                        placeholder="Tell us more about your inquiry..."
                                        className="w-full px-4 py-3 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                                        value={formData.message}
                                        onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                                    />
                                </div>

                                <button
                                    type="submit"
                                    className="w-full py-4 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2"
                                >
                                    Send Message
                                    <Send className="w-5 h-5" />
                                </button>
                            </form>
                        </motion.div>
                    </div>
                </div>
            </section>

            <footer className="py-12 border-t border-zinc-200 dark:border-zinc-900 text-center text-zinc-500 text-sm">
                <p>© 2026 Qmath EdTech AB. All rights reserved.</p>
            </footer>
        </main>
    );
}
