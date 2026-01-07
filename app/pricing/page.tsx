'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Header } from '@/components/Header';
import { Check, X, Sparkles, ArrowRight, HelpCircle, Building2, Users } from 'lucide-react';
import { useState } from 'react';

const plans = [
    {
        name: 'Free',
        description: 'Perfect for trying out Qmath',
        price: { monthly: 0, yearly: 0 },
        features: [
            { text: '10 practice questions/day', included: true },
            { text: 'Basic analytics dashboard', included: true },
            { text: '1 course access', included: true },
            { text: 'Community support', included: true },
            { text: 'Adaptive learning engine', included: false },
            { text: 'Exam simulations', included: false },
            { text: 'AI Tutor', included: false },
            { text: 'Spaced repetition', included: false },
        ],
        cta: 'Get Started',
        href: '/register',
        popular: false
    },
    {
        name: 'Student',
        description: 'Best for active learners',
        price: { monthly: 99, yearly: 79 },
        currency: 'SEK',
        features: [
            { text: 'Unlimited practice questions', included: true },
            { text: 'Full analytics dashboard', included: true },
            { text: 'All courses access', included: true },
            { text: 'Priority support', included: true },
            { text: 'Adaptive learning engine', included: true },
            { text: 'Unlimited exam simulations', included: true },
            { text: 'AI Tutor assistance', included: true },
            { text: 'Spaced repetition flashcards', included: true },
        ],
        cta: 'Start Free Trial',
        href: '/register?plan=student',
        popular: true
    },
    {
        name: 'University',
        description: 'For institutions & teams',
        price: { monthly: 'Custom', yearly: 'Custom' },
        features: [
            { text: 'Everything in Student', included: true },
            { text: 'Admin dashboard', included: true },
            { text: 'Student progress tracking', included: true },
            { text: 'Custom content integration', included: true },
            { text: 'SSO authentication', included: true },
            { text: 'API access', included: true },
            { text: 'Dedicated success manager', included: true },
            { text: 'Custom analytics & reports', included: true },
        ],
        cta: 'Contact Sales',
        href: '/contact',
        popular: false
    }
];

const faqs = [
    {
        question: 'Can I switch plans at any time?',
        answer: 'Yes! You can upgrade or downgrade your plan at any time. Changes take effect immediately and we\'ll prorate any payments.'
    },
    {
        question: 'Is there a free trial for the Student plan?',
        answer: 'Absolutely! Every new user gets a 14-day free trial of the full Student plan with no credit card required.'
    },
    {
        question: 'What payment methods do you accept?',
        answer: 'We accept all major credit cards (Visa, Mastercard, Amex), as well as Swish for Swedish users and bank transfers for universities.'
    },
    {
        question: 'Can I get a refund?',
        answer: 'Yes, we offer a 30-day money-back guarantee. If you\'re not satisfied, contact us and we\'ll process your refund.'
    }
];

export default function PricingPage() {
    const [isYearly, setIsYearly] = useState(true);

    return (
        <main className="min-h-screen bg-white dark:bg-black text-zinc-900 dark:text-white">
            <Header />

            {/* Hero Section */}
            <section className="relative pt-32 pb-20 px-4 overflow-hidden">
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>

                <div className="max-w-4xl mx-auto text-center relative z-10">
                    <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-5xl md:text-7xl font-bold tracking-tight mb-6"
                    >
                        Simple, transparent{' '}
                        <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                            pricing
                        </span>
                    </motion.h1>

                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="text-xl text-zinc-600 dark:text-zinc-400 max-w-2xl mx-auto mb-12"
                    >
                        Choose the plan that fits your learning journey. No hidden fees, cancel anytime.
                    </motion.p>

                    {/* Billing Toggle */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="inline-flex items-center gap-4 bg-zinc-100 dark:bg-zinc-900 p-1.5 rounded-full"
                    >
                        <button
                            onClick={() => setIsYearly(false)}
                            className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${!isYearly
                                ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-sm'
                                : 'text-zinc-600 dark:text-zinc-400'
                                }`}
                        >
                            Monthly
                        </button>
                        <button
                            onClick={() => setIsYearly(true)}
                            className={`px-6 py-2 rounded-full text-sm font-medium transition-all flex items-center gap-2 ${isYearly
                                ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-sm'
                                : 'text-zinc-600 dark:text-zinc-400'
                                }`}
                        >
                            Yearly
                            <span className="px-2 py-0.5 bg-green-100 dark:bg-green-500/20 text-green-600 dark:text-green-400 text-xs rounded-full">
                                Save 20%
                            </span>
                        </button>
                    </motion.div>
                </div>
            </section>

            {/* Pricing Cards */}
            <section className="pb-24 px-4">
                <div className="max-w-6xl mx-auto">
                    <div className="grid md:grid-cols-3 gap-8">
                        {plans.map((plan, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.1 * i }}
                                className={`relative bg-white dark:bg-zinc-900 rounded-2xl p-8 border ${plan.popular
                                    ? 'border-blue-500 shadow-xl shadow-blue-500/10'
                                    : 'border-zinc-200 dark:border-zinc-800'
                                    }`}
                            >
                                {plan.popular && (
                                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white text-sm font-medium rounded-full flex items-center gap-1">
                                        <Sparkles className="w-3 h-3" />
                                        Most Popular
                                    </div>
                                )}

                                <div className="mb-6">
                                    <h3 className="text-xl font-bold mb-1">{plan.name}</h3>
                                    <p className="text-sm text-zinc-500">{plan.description}</p>
                                </div>

                                <div className="mb-8">
                                    {typeof plan.price.monthly === 'number' ? (
                                        <div className="flex items-baseline gap-1">
                                            <span className="text-5xl font-bold">
                                                {isYearly ? plan.price.yearly : plan.price.monthly}
                                            </span>
                                            {typeof plan.price.monthly === 'number' && plan.price.monthly > 0 && (
                                                <>
                                                    <span className="text-xl text-zinc-500">{plan.currency}</span>
                                                    <span className="text-zinc-500">/month</span>
                                                </>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="text-4xl font-bold">{plan.price.monthly}</div>
                                    )}
                                    {isYearly && typeof plan.price.monthly === 'number' && plan.price.monthly > 0 && typeof plan.price.yearly === 'number' && (
                                        <p className="text-sm text-zinc-500 mt-1">
                                            Billed yearly ({plan.price.yearly * 12} SEK/year)
                                        </p>
                                    )}
                                </div>

                                <ul className="space-y-4 mb-8">
                                    {plan.features.map((feature, j) => (
                                        <li key={j} className="flex items-start gap-3">
                                            {feature.included ? (
                                                <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
                                            ) : (
                                                <X className="w-5 h-5 text-zinc-300 dark:text-zinc-700 flex-shrink-0" />
                                            )}
                                            <span className={feature.included ? 'text-zinc-700 dark:text-zinc-300' : 'text-zinc-400 dark:text-zinc-600'}>
                                                {feature.text}
                                            </span>
                                        </li>
                                    ))}
                                </ul>

                                <Link
                                    href={plan.href}
                                    className={`block w-full py-3 px-6 rounded-xl font-semibold text-center transition-all ${plan.popular
                                        ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-500/20'
                                        : 'bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-900 dark:text-white'
                                        }`}
                                >
                                    {plan.cta}
                                </Link>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Enterprise CTA */}
            <section className="py-16 px-4 bg-gradient-to-r from-blue-600 to-purple-600">
                <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8">
                    <div className="text-white text-center md:text-left">
                        <div className="flex items-center gap-2 mb-2">
                            <Building2 className="w-6 h-6" />
                            <span className="font-medium">For Universities</span>
                        </div>
                        <h2 className="text-3xl font-bold mb-2">Need a custom solution?</h2>
                        <p className="text-white/80">
                            Get volume pricing, SSO integration, and dedicated support for your institution.
                        </p>
                    </div>
                    <Link
                        href="/universities"
                        className="px-8 py-4 bg-white text-blue-600 rounded-full font-bold hover:bg-blue-50 transition-all flex items-center gap-2 whitespace-nowrap"
                    >
                        Learn More
                        <ArrowRight className="w-5 h-5" />
                    </Link>
                </div>
            </section>

            {/* FAQ Section */}
            <section className="py-24 px-4">
                <div className="max-w-3xl mx-auto">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl font-bold mb-4">Frequently Asked Questions</h2>
                        <p className="text-zinc-600 dark:text-zinc-400">
                            Can't find what you're looking for?{' '}
                            <Link href="/contact" className="text-blue-600 hover:underline">Contact us</Link>
                        </p>
                    </div>

                    <div className="space-y-4">
                        {faqs.map((faq, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, y: 10 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: i * 0.1 }}
                                className="bg-zinc-50 dark:bg-zinc-900 rounded-xl p-6 border border-zinc-200 dark:border-zinc-800"
                            >
                                <div className="flex items-start gap-4">
                                    <HelpCircle className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
                                    <div>
                                        <h3 className="font-semibold mb-2">{faq.question}</h3>
                                        <p className="text-zinc-600 dark:text-zinc-400 text-sm">{faq.answer}</p>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="py-12 border-t border-zinc-200 dark:border-zinc-900 text-center text-zinc-500 text-sm">
                <p>© 2026 Qmath EdTech AB. All rights reserved.</p>
            </footer>
        </main>
    );
}
