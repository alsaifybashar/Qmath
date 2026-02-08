'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useState, useMemo } from 'react';
import {
    Search, Bookmark, BookOpen, FileText, Clock, Star, Filter,
    Grid, List, ChevronDown, Tag, X, Heart, Share2, MoreHorizontal,
    SortAsc, SortDesc, FolderOpen, Trash2, Plus
} from 'lucide-react';
import Link from 'next/link';

// Types
export interface LibraryItem {
    id: string;
    type: 'problem' | 'topic' | 'flashcard_deck' | 'exam' | 'note';
    title: string;
    description?: string;
    courseId: string;
    courseTitle: string;
    savedAt: Date;
    lastAccessed?: Date;
    tags: string[];
    isFavorite: boolean;
    difficulty?: 1 | 2 | 3 | 4 | 5;
    progressPercent?: number;
}

interface PersonalLibraryProps {
    items: LibraryItem[];
    onToggleFavorite: (id: string) => void;
    onRemove: (id: string) => void;
    onAddTag: (id: string, tag: string) => void;
}

const typeConfig = {
    problem: { icon: FileText, color: 'blue', label: 'Problem' },
    topic: { icon: BookOpen, color: 'purple', label: 'Topic' },
    flashcard_deck: { icon: Star, color: 'yellow', label: 'Flashcards' },
    exam: { icon: Clock, color: 'red', label: 'Exam' },
    note: { icon: Tag, color: 'green', label: 'Note' }
};

const colorClasses = {
    blue: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400',
    purple: 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400',
    yellow: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400',
    red: 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400',
    green: 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400'
};

export default function PersonalLibrary({ items, onToggleFavorite, onRemove, onAddTag }: PersonalLibraryProps) {
    const [searchQuery, setSearchQuery] = useState('');
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [filterType, setFilterType] = useState<string | null>(null);
    const [filterCourse, setFilterCourse] = useState<string | null>(null);
    const [sortBy, setSortBy] = useState<'recent' | 'alphabetical' | 'favorites'>('recent');
    const [showFilters, setShowFilters] = useState(false);
    const [selectedItem, setSelectedItem] = useState<string | null>(null);

    // Get unique courses for filter
    const courses = useMemo(() => {
        const unique = [...new Set(items.map(i => i.courseId))];
        return unique.map(id => ({
            id,
            title: items.find(i => i.courseId === id)?.courseTitle || id
        }));
    }, [items]);

    // Filtered and sorted items
    const filteredItems = useMemo(() => {
        let result = [...items];

        // Search
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            result = result.filter(item =>
                item.title.toLowerCase().includes(query) ||
                item.description?.toLowerCase().includes(query) ||
                item.tags.some(t => t.toLowerCase().includes(query))
            );
        }

        // Filter by type
        if (filterType) {
            result = result.filter(item => item.type === filterType);
        }

        // Filter by course
        if (filterCourse) {
            result = result.filter(item => item.courseId === filterCourse);
        }

        // Sort
        switch (sortBy) {
            case 'recent':
                result.sort((a, b) => new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime());
                break;
            case 'alphabetical':
                result.sort((a, b) => a.title.localeCompare(b.title));
                break;
            case 'favorites':
                result.sort((a, b) => (b.isFavorite ? 1 : 0) - (a.isFavorite ? 1 : 0));
                break;
        }

        return result;
    }, [items, searchQuery, filterType, filterCourse, sortBy]);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-zinc-900 dark:text-white">My Library</h2>
                    <p className="text-sm text-zinc-500">{items.length} saved items</p>
                </div>

                {/* Search bar with auto-complete animation */}
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
                    <motion.input
                        type="text"
                        placeholder="Search your library..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-12 pr-4 py-3 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                        whileFocus={{ scale: 1.01 }}
                    />
                    {searchQuery && (
                        <motion.button
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            onClick={() => setSearchQuery('')}
                            className="absolute right-4 top-1/2 -translate-y-1/2 p-1 hover:bg-zinc-100 dark:hover:bg-zinc-700 rounded-full"
                        >
                            <X className="w-4 h-4 text-zinc-400" />
                        </motion.button>
                    )}
                </div>
            </div>

            {/* Filter bar */}
            <div className="flex flex-wrap items-center gap-3">
                {/* Toggle filters */}
                <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setShowFilters(!showFilters)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl border transition-colors ${showFilters
                            ? 'bg-blue-500 text-white border-blue-500'
                            : 'bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300'
                        }`}
                >
                    <Filter className="w-4 h-4" />
                    Filters
                    {(filterType || filterCourse) && (
                        <span className="w-2 h-2 bg-orange-400 rounded-full" />
                    )}
                </motion.button>

                {/* Type filter chips */}
                <AnimatePresence>
                    {showFilters && (
                        <motion.div
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -10 }}
                            className="flex flex-wrap gap-2"
                        >
                            {Object.entries(typeConfig).map(([type, config]) => (
                                <motion.button
                                    key={type}
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => setFilterType(filterType === type ? null : type)}
                                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all ${filterType === type
                                            ? colorClasses[config.color as keyof typeof colorClasses]
                                            : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400'
                                        }`}
                                >
                                    <config.icon className="w-3.5 h-3.5" />
                                    {config.label}
                                </motion.button>
                            ))}
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Spacer */}
                <div className="flex-1" />

                {/* View mode toggle */}
                <div className="flex items-center bg-zinc-100 dark:bg-zinc-800 rounded-lg p-1">
                    <button
                        onClick={() => setViewMode('grid')}
                        className={`p-2 rounded-md transition-colors ${viewMode === 'grid' ? 'bg-white dark:bg-zinc-700 shadow-sm' : ''}`}
                    >
                        <Grid className="w-4 h-4" />
                    </button>
                    <button
                        onClick={() => setViewMode('list')}
                        className={`p-2 rounded-md transition-colors ${viewMode === 'list' ? 'bg-white dark:bg-zinc-700 shadow-sm' : ''}`}
                    >
                        <List className="w-4 h-4" />
                    </button>
                </div>

                {/* Sort dropdown */}
                <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                    className="px-3 py-2 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm"
                >
                    <option value="recent">Most Recent</option>
                    <option value="alphabetical">Alphabetical</option>
                    <option value="favorites">Favorites First</option>
                </select>
            </div>

            {/* Items grid/list */}
            <motion.div
                layout
                className={viewMode === 'grid'
                    ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'
                    : 'space-y-3'
                }
            >
                <AnimatePresence mode="popLayout">
                    {filteredItems.map((item, index) => (
                        <LibraryItemCard
                            key={item.id}
                            item={item}
                            index={index}
                            viewMode={viewMode}
                            onToggleFavorite={() => onToggleFavorite(item.id)}
                            onRemove={() => onRemove(item.id)}
                        />
                    ))}
                </AnimatePresence>
            </motion.div>

            {/* Empty state */}
            {filteredItems.length === 0 && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center py-16"
                >
                    <FolderOpen className="w-16 h-16 mx-auto text-zinc-300 dark:text-zinc-600 mb-4" />
                    <h3 className="text-lg font-semibold text-zinc-700 dark:text-zinc-300 mb-2">
                        {searchQuery ? 'No results found' : 'Your library is empty'}
                    </h3>
                    <p className="text-sm text-zinc-500">
                        {searchQuery
                            ? 'Try a different search term'
                            : 'Bookmark problems and topics to see them here'
                        }
                    </p>
                </motion.div>
            )}
        </div>
    );
}

// Library Item Card
function LibraryItemCard({
    item,
    index,
    viewMode,
    onToggleFavorite,
    onRemove
}: {
    item: LibraryItem;
    index: number;
    viewMode: 'grid' | 'list';
    onToggleFavorite: () => void;
    onRemove: () => void;
}) {
    const [showMenu, setShowMenu] = useState(false);
    const config = typeConfig[item.type];
    const colors = colorClasses[config.color as keyof typeof colorClasses];

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ delay: index * 0.03 }}
            whileHover={{ y: -2 }}
            className={`group relative bg-white dark:bg-zinc-800 rounded-xl border border-zinc-200 dark:border-zinc-700 overflow-hidden hover:shadow-lg hover:border-blue-300 dark:hover:border-blue-700 transition-all ${viewMode === 'list' ? 'flex items-center gap-4 p-4' : 'p-4'
                }`}
        >
            {/* Save animation overlay */}
            <motion.div
                initial={false}
                animate={item.isFavorite ? { scale: [1, 1.2, 1], opacity: [0, 0.5, 0] } : {}}
                className="absolute inset-0 bg-pink-500 pointer-events-none"
            />

            {/* Type badge */}
            <div className={`${viewMode === 'list' ? '' : 'mb-3'}`}>
                <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${colors}`}>
                    <config.icon className="w-3.5 h-3.5" />
                    {config.label}
                </div>
            </div>

            {/* Content */}
            <div className={`flex-1 min-w-0 ${viewMode === 'list' ? '' : 'mb-3'}`}>
                <Link href={`/${item.type}/${item.id}`}>
                    <h3 className="font-semibold text-zinc-900 dark:text-white truncate hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                        {item.title}
                    </h3>
                </Link>
                {item.description && (
                    <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1 line-clamp-2">
                        {item.description}
                    </p>
                )}
                <p className="text-xs text-zinc-400 mt-2">{item.courseTitle}</p>
            </div>

            {/* Actions */}
            <div className={`flex items-center gap-2 ${viewMode === 'list' ? '' : 'pt-3 border-t border-zinc-100 dark:border-zinc-700'}`}>
                <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={onToggleFavorite}
                    className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-700 rounded-lg transition-colors"
                >
                    <Heart
                        className={`w-4 h-4 transition-colors ${item.isFavorite
                                ? 'text-pink-500 fill-pink-500'
                                : 'text-zinc-400 hover:text-pink-500'
                            }`}
                    />
                </motion.button>

                <button
                    onClick={() => setShowMenu(!showMenu)}
                    className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-700 rounded-lg transition-colors"
                >
                    <MoreHorizontal className="w-4 h-4 text-zinc-400" />
                </button>

                {/* Dropdown menu */}
                <AnimatePresence>
                    {showMenu && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: -10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: -10 }}
                            className="absolute right-4 top-12 z-10 bg-white dark:bg-zinc-800 rounded-xl shadow-xl border border-zinc-200 dark:border-zinc-700 py-1 min-w-[140px]"
                        >
                            <button className="w-full px-4 py-2 text-left text-sm hover:bg-zinc-100 dark:hover:bg-zinc-700 flex items-center gap-2">
                                <Share2 className="w-4 h-4" /> Share
                            </button>
                            <button className="w-full px-4 py-2 text-left text-sm hover:bg-zinc-100 dark:hover:bg-zinc-700 flex items-center gap-2">
                                <Tag className="w-4 h-4" /> Add Tag
                            </button>
                            <button
                                onClick={onRemove}
                                className="w-full px-4 py-2 text-left text-sm hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 flex items-center gap-2"
                            >
                                <Trash2 className="w-4 h-4" /> Remove
                            </button>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Tags */}
            {item.tags.length > 0 && viewMode === 'grid' && (
                <div className="flex flex-wrap gap-1 mt-2">
                    {item.tags.slice(0, 3).map(tag => (
                        <span key={tag} className="text-xs px-2 py-0.5 bg-zinc-100 dark:bg-zinc-700 rounded-full text-zinc-500">
                            {tag}
                        </span>
                    ))}
                </div>
            )}
        </motion.div>
    );
}
