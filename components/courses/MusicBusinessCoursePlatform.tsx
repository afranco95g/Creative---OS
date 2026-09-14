'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  BookOpen,
  CheckCircle2,
  Clock,
  Download,
  FileText,
  HelpCircle,
  Layers,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Award,
  ArrowRight,
  ExternalLink,
  PlayCircle,
  FolderDown,
  Check
} from 'lucide-react';
import { MUSIC_BUSINESS_PROGRAM, ProgramModule, ProgramLesson, LessonResource } from './musicBusinessProgramData';

const STORAGE_KEY = 'imagine_music_business_progress_v1';

export function MusicBusinessCoursePlatform() {
  const [activeTabId, setActiveTabId] = useState<string>(MUSIC_BUSINESS_PROGRAM[0].id);
  const [completedModules, setCompletedModules] = useState<string[]>([]);
  const [expandedLessons, setExpandedLessons] = useState<Record<string, boolean>>({});
  const [completedLessons, setCompletedLessons] = useState<string[]>([]);

  // Load progress from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed.completedModules)) {
          setCompletedModules(parsed.completedModules);
        }
        if (Array.isArray(parsed.completedLessons)) {
          setCompletedLessons(parsed.completedLessons);
        }
      }
    } catch (e) {
      console.error('Error loading course progress', e);
    }
  }, []);

  // Save progress
  const saveProgress = (modules: string[], lessons: string[]) => {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ completedModules: modules, completedLessons: lessons })
      );
    } catch (e) {
      console.error('Error saving progress', e);
    }
  };

  const activeModule = MUSIC_BUSINESS_PROGRAM.find((m) => m.id === activeTabId) || MUSIC_BUSINESS_PROGRAM[0];

  const toggleModuleCompletion = (moduleId: string) => {
    setCompletedModules((prev) => {
      const isCompleted = prev.includes(moduleId);
      const updated = isCompleted ? prev.filter((id) => id !== moduleId) : [...prev, moduleId];
      saveProgress(updated, completedLessons);
      return updated;
    });
  };

  const toggleLessonCompletion = (lessonId: string) => {
    setCompletedLessons((prev) => {
      const isCompleted = prev.includes(lessonId);
      const updated = isCompleted ? prev.filter((id) => id !== lessonId) : [...prev, lessonId];
      saveProgress(completedModules, updated);
      return updated;
    });
  };

  const toggleLessonAccordion = (lessonId: string) => {
    setExpandedLessons((prev) => ({
      ...prev,
      [lessonId]: !prev[lessonId],
    }));
  };

  // Overall calculations
  const totalLessons = MUSIC_BUSINESS_PROGRAM.reduce((acc, m) => acc + m.lessons.length, 0);
  const totalHours = MUSIC_BUSINESS_PROGRAM.reduce((acc, m) => acc + m.estimatedHours, 0);
  const totalResources = MUSIC_BUSINESS_PROGRAM.reduce((acc, m) => acc + m.resources.length, 0);
  const progressPercentage = Math.round((completedModules.length / MUSIC_BUSINESS_PROGRAM.length) * 100);

  return (
    <div className="space-y-10">
      {/* Course Hero Banner */}
      <section className="relative overflow-hidden rounded-[36px] border border-borde/10 bg-superficie-elevada p-8 md:p-10 shadow-2xl">
        <div className="absolute right-0 top-0 -mr-16 -mt-16 h-80 w-80 rounded-full bg-rojo-base/5 blur-3xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col gap-8 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-3xl">
            <div className="flex flex-wrap items-center gap-3">
              <span className="rounded-full border border-acento/30 bg-rojo-base/10 px-3.5 py-1 text-xs font-bold tracking-wider text-texto-principal uppercase">
                Programa Ejecutivo
              </span>
              <span className="rounded-full border border-borde/15 bg-superficie px-3.5 py-1 text-xs font-semibold text-texto-largo">
                Imagine Company S.A.S.
              </span>
              <span className="rounded-full border border-borde/15 bg-superficie px-3.5 py-1 text-xs font-semibold text-texto-largo">
                Modo Asincrónico
              </span>
            </div>

            <h1 className="mt-5 text-3xl font-bold tracking-tight text-hueso sm:text-5xl">
              Music Business & Industria Sonora
            </h1>

            <p className="mt-4 text-base leading-7 text-texto-largo sm:text-lg">
              Plataforma de estructuración y aceleración para artistas, productores y managers. Desarrolla paso a paso tu plan de marketing, presupuestos, estrategia legal y el <strong>Music Business Deck</strong> final.
            </p>

            {/* Quick Metrics Bar */}
            <div className="mt-8 flex flex-wrap items-center gap-6 border-t border-borde/10 pt-6">
              <div className="flex items-center gap-2.5">
                <Layers className="h-5 w-5 text-texto-principal" />
                <span className="text-sm font-semibold text-hueso">6 Módulos Oficiales</span>
              </div>
              <div className="flex items-center gap-2.5">
                <BookOpen className="h-5 w-5 text-texto-principal" />
                <span className="text-sm font-semibold text-hueso">{totalLessons} Lecciones Temáticas</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Clock className="h-5 w-5 text-texto-principal" />
                <span className="text-sm font-semibold text-hueso">{totalHours} Horas Autónomas</span>
              </div>
              <div className="flex items-center gap-2.5">
                <FolderDown className="h-5 w-5 text-texto-principal" />
                <span className="text-sm font-semibold text-hueso">{totalResources} Recursos Descargables</span>
              </div>
            </div>
          </div>

          {/* Progress Card */}
          <div className="w-full shrink-0 rounded-3xl border border-borde/10 bg-superficie p-6 lg:w-80">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-texto-largo">Progreso General</span>
              <span className="text-sm font-bold text-texto-principal">{progressPercentage}%</span>
            </div>

            <div className="mt-3 h-2.5 w-full overflow-hidden rounded-full bg-superficie-elevada">
              <div
                className="h-full bg-rojo-base transition-all duration-500 rounded-full"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>

            <div className="mt-4 flex items-center justify-between text-xs text-texto-largo">
              <span>{completedModules.length} de 6 módulos completados</span>
              <span>{completedLessons.length} lecciones</span>
            </div>

            {progressPercentage === 100 ? (
              <div className="mt-5 flex items-center gap-2 rounded-2xl bg-rojo-base/10 border border-rojo-base/30 p-3 text-xs font-semibold text-texto-principal">
                <Award className="h-4 w-4 shrink-0 text-texto-principal" />
                <span>¡Has completado todos los módulos del programa!</span>
              </div>
            ) : (
              <p className="mt-4 text-xs leading-5 text-texto-largo/80">
                Avanza a tu propio ritmo. Recuerda descargar los recursos y plantillas de cada etapa.
              </p>
            )}
          </div>
        </div>
      </section>

      {/* Persistent Navigation Tabs */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-xs font-bold uppercase tracking-widest text-texto-principal">
            Navegación Modular del Programa
          </p>
          <span className="text-xs text-texto-largo">Selecciona un módulo para explorar su contenido</span>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          {MUSIC_BUSINESS_PROGRAM.map((module) => {
            const isActive = activeTabId === module.id;
            const isCompleted = completedModules.includes(module.id);

            return (
              <button
                key={module.id}
                onClick={() => setActiveTabId(module.id)}
                className={`group relative flex flex-col justify-between rounded-2xl p-4 text-left transition-all duration-200 ${
                  isActive
                    ? 'bg-superficie-elevada border-2 border-rojo-base shadow-lg shadow-rojo-base/5'
                    : 'bg-superficie-elevada/60 border border-borde/10 hover:border-borde/30 hover:bg-superficie-elevada'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-xs font-bold ${
                        isActive ? 'text-texto-principal' : 'text-texto-largo'
                      }`}
                    >
                      Módulo 0{module.number}
                    </span>
                    {isCompleted ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                    ) : (
                      <span className="h-2 w-2 rounded-full bg-borde/30" />
                    )}
                  </div>

                  <h3
                    className={`mt-2 text-sm font-semibold line-clamp-2 leading-snug ${
                      isActive ? 'text-hueso' : 'text-texto-largo group-hover:text-hueso'
                    }`}
                  >
                    {module.title.replace(/^Módulo \d+:\s*/, '')}
                  </h3>
                </div>

                <div className="mt-4 flex items-center justify-between text-[11px] text-texto-largo/70">
                  <span>{module.lessons.length} lecciones</span>
                  <span>{module.estimatedHours}h</span>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* Active Module Detail View */}
      <section className="rounded-[36px] border border-borde/10 bg-superficie-elevada p-8 md:p-10 space-y-10">
        {/* Module Header & Actions */}
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between border-b border-borde/10 pb-8">
          <div className="max-w-3xl space-y-3">
            <div className="flex items-center gap-3">
              <span className="text-xs font-bold uppercase tracking-widest text-texto-principal">
                Módulo 0{activeModule.number}
              </span>
              <span className="text-borde/40">•</span>
              <span className="inline-flex items-center gap-1.5 text-xs text-texto-largo">
                <Clock className="h-3.5 w-3.5" /> Tiempo estimado: <strong>{activeModule.estimatedHours} horas</strong>
              </span>
            </div>

            <h2 className="text-2xl font-bold tracking-tight text-hueso sm:text-3xl">
              {activeModule.title}
            </h2>

            <p className="text-sm leading-7 text-texto-largo sm:text-base">
              {activeModule.description}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
            <button
              onClick={() => toggleModuleCompletion(activeModule.id)}
              className={`inline-flex items-center justify-center gap-2.5 rounded-full px-6 py-3.5 text-sm font-bold transition-all ${
                completedModules.includes(activeModule.id)
                  ? 'bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 hover:bg-emerald-900/40'
                  : 'bg-rojo-base text-hueso hover:bg-rojo-base/90 shadow-md shadow-rojo-base/20'
              }`}
            >
              <CheckCircle2 className="h-4 w-4" />
              {completedModules.includes(activeModule.id)
                ? 'Módulo Completado (Desmarcar)'
                : 'Marcar módulo como completado'}
            </button>
          </div>
        </div>

        {/* 2-Column Grid: Learning Objectives & Resources */}
        <div className="grid gap-8 lg:grid-cols-12">
          {/* Column 1: Objectives (7 cols) */}
          <div className="lg:col-span-7 space-y-4">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-texto-principal" />
              <h3 className="text-sm font-bold uppercase tracking-wider text-hueso">
                Objetivos de Aprendizaje
              </h3>
            </div>

            <div className="rounded-2xl border border-borde/10 bg-superficie p-6 space-y-3">
              {activeModule.learningObjectives.map((obj, i) => (
                <div key={i} className="flex items-start gap-3">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-rojo-base/10 text-[11px] font-bold text-texto-principal">
                    {i + 1}
                  </span>
                  <p className="text-sm leading-6 text-texto-largo">{obj}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Column 2: Downloadable Resources (5 cols) */}
          <div className="lg:col-span-5 space-y-4">
            <div className="flex items-center gap-2">
              <FolderDown className="h-4 w-4 text-texto-principal" />
              <h3 className="text-sm font-bold uppercase tracking-wider text-hueso">
                Recursos y Plantillas
              </h3>
            </div>

            <div className="space-y-3">
              {activeModule.resources.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-borde/15 p-6 text-center text-xs text-texto-largo">
                  No hay recursos descargables adicionales para este módulo.
                </div>
              ) : (
                activeModule.resources.map((res) => (
                  <div
                    key={res.id}
                    className="group flex flex-col justify-between rounded-2xl border border-borde/10 bg-superficie p-5 transition hover:border-borde/30 hover:bg-superficie/80"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="rounded bg-superficie-elevada px-2 py-0.5 text-[10px] font-bold text-texto-principal uppercase border border-borde/10">
                            {res.format}
                          </span>
                          <span className="text-[11px] text-texto-largo/70">{res.size}</span>
                        </div>
                        <h4 className="text-sm font-semibold text-hueso">{res.title}</h4>
                        <p className="text-xs leading-5 text-texto-largo">{res.description}</p>
                      </div>

                      <a
                        href={res.downloadUrl}
                        download
                        onClick={(e) => {
                          e.preventDefault();
                          alert(`Descargando recurso: ${res.title} (${res.format})`);
                        }}
                        className="shrink-0 rounded-full border border-borde/20 bg-superficie-elevada p-2.5 text-texto-largo transition hover:border-rojo-base hover:text-texto-principal"
                        title="Descargar archivo"
                      >
                        <Download className="h-4 w-4" />
                      </a>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Lessons Accordion / List */}
        <div className="space-y-6 pt-4 border-t border-borde/10">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h3 className="text-xl font-bold text-hueso">
                Lecciones del Módulo ({activeModule.lessons.length})
              </h3>
              <p className="text-xs text-texto-largo mt-1">
                Explora el contenido paso a paso y marca cada lección a medida que avanzas en tu asesoría.
              </p>
            </div>

            <span className="text-xs font-medium text-texto-principal bg-rojo-base/10 border border-rojo-base/20 px-3 py-1.5 rounded-full self-start sm:self-auto">
              Contenido oficial del programa
            </span>
          </div>

          <div className="space-y-3">
            {activeModule.lessons.map((lesson) => {
              const isExpanded = !!expandedLessons[lesson.id];
              const isCompleted = completedLessons.includes(lesson.id);

              return (
                <div
                  key={lesson.id}
                  className={`overflow-hidden rounded-2xl border transition-all ${
                    isExpanded
                      ? 'border-borde/30 bg-superficie shadow-md'
                      : 'border-borde/10 bg-superficie hover:border-borde/20'
                  }`}
                >
                  {/* Lesson Header Row */}
                  <div
                    onClick={() => toggleLessonAccordion(lesson.id)}
                    className="flex cursor-pointer items-center justify-between gap-4 p-5 select-none"
                  >
                    <div className="flex items-center gap-4 min-w-0">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleLessonCompletion(lesson.id);
                        }}
                        className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border transition ${
                          isCompleted
                            ? 'bg-emerald-500 border-emerald-500 text-black'
                            : 'border-borde/30 bg-superficie-elevada hover:border-texto-principal'
                        }`}
                        title={isCompleted ? 'Marcar como pendiente' : 'Marcar como vista'}
                      >
                        {isCompleted && <Check className="h-3.5 w-3.5 stroke-[3]" />}
                      </button>

                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono font-bold text-texto-principal">
                            Lección {lesson.position}
                          </span>
                          <span className="text-borde/40">•</span>
                          <span className="text-xs text-texto-largo flex items-center gap-1">
                            <Clock className="h-3 w-3" /> {lesson.durationMinutes} min
                          </span>
                        </div>
                        <h4
                          className={`text-base font-semibold truncate ${
                            isCompleted ? 'line-through text-texto-largo' : 'text-hueso'
                          }`}
                        >
                          {lesson.title}
                        </h4>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <span className="text-xs font-medium text-texto-largo hidden sm:inline">
                        {isExpanded ? 'Ocultar detalles' : 'Ver temario'}
                      </span>
                      {isExpanded ? (
                        <ChevronUp className="h-5 w-5 text-texto-principal" />
                      ) : (
                        <ChevronDown className="h-5 w-5 text-texto-largo" />
                      )}
                    </div>
                  </div>

                  {/* Expanded Lesson Body */}
                  {isExpanded && (
                    <div className="border-t border-borde/10 bg-superficie-elevada/40 p-6 space-y-4">
                      <div>
                        <p className="text-xs font-bold uppercase tracking-wider text-texto-largo">
                          Descripción de la sesión
                        </p>
                        <p className="mt-1 text-sm leading-relaxed text-texto-largo">
                          {lesson.description}
                        </p>
                      </div>

                      <div>
                        <p className="text-xs font-bold uppercase tracking-wider text-texto-largo mb-2">
                          Puntos Clave y Entregables
                        </p>
                        <div className="grid gap-2 sm:grid-cols-3">
                          {lesson.keyTakeaways.map((takeaway, idx) => (
                            <div
                              key={idx}
                              className="rounded-xl border border-borde/10 bg-superficie p-3 text-xs leading-5 text-texto-largo"
                            >
                              <span className="font-bold text-texto-principal mr-1.5">•</span>
                              {takeaway}
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="flex justify-end pt-2">
                        <button
                          type="button"
                          onClick={() => toggleLessonCompletion(lesson.id)}
                          className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-bold transition ${
                            isCompleted
                              ? 'bg-superficie border border-borde/20 text-texto-largo hover:text-hueso'
                              : 'bg-rojo-base text-hueso hover:bg-rojo-base/90'
                          }`}
                        >
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          {isCompleted ? 'Desmarcar lección' : 'Completar esta lección'}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
}

