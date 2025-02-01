"use client";

import { useEffect, useState, useRef } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import {
  Book,
  Moon,
  Sun,
  Loader2,
  Play,
  Pause,
  Volume2,
  Languages,
  Heart,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "next-themes";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

interface Surah {
  number: number;
  name: string;
  englishName: string;
  englishNameTranslation: string;
  numberOfAyahs: number;
}

interface Verse {
  number: number;
  text: string;
  translations: {
    en: string;
    id: string;
  };
  audio: string;
}

type Language = "en" | "id";

const TRANSLATION_EDITIONS = {
  en: "en.sahih",
  id: "id.indonesian",
};

export default function Home() {
  const [surahs, setSurahs] = useState<Surah[]>([]);
  const [selectedSurah, setSelectedSurah] = useState<string>("1");
  const [verses, setVerses] = useState<Verse[]>([]);
  const [loading, setLoading] = useState(true);
  const [playingVerse, setPlayingVerse] = useState<number | null>(null);
  const [autoScroll, setAutoScroll] = useState(true);
  const [language, setLanguage] = useState<Language>("en");
  const { theme, setTheme } = useTheme();
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const verseRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    fetch("https://api.alquran.cloud/v1/surah")
      .then((res) => res.json())
      .then((data) => {
        setSurahs(data.data);
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    setLoading(true);
    setPlayingVerse(null);
    if (audioRef.current) {
      audioRef.current.pause();
    }

    Promise.all([
      fetch(`https://api.alquran.cloud/v1/surah/${selectedSurah}`).then((res) =>
        res.json()
      ),
      fetch(
        `https://api.alquran.cloud/v1/surah/${selectedSurah}/${TRANSLATION_EDITIONS.en}`
      ).then((res) => res.json()),
      fetch(
        `https://api.alquran.cloud/v1/surah/${selectedSurah}/${TRANSLATION_EDITIONS.id}`
      ).then((res) => res.json()),
    ]).then(([arabicData, englishData, indonesianData]) => {
      const combinedVerses = arabicData.data.ayahs.map(
        (ayah: any, index: number) => ({
          number: ayah.numberInSurah,
          text: ayah.text,
          translations: {
            en: englishData.data.ayahs[index].text,
            id: indonesianData.data.ayahs[index].text,
          },
          audio: `https://cdn.islamic.network/quran/audio/128/ar.alafasy/${ayah.number}.mp3`,
        })
      );
      setVerses(combinedVerses);
      setLoading(false);
      verseRefs.current = verseRefs.current.slice(0, combinedVerses.length);
    });
  }, [selectedSurah]);

  const scrollToVerse = (verseNumber: number) => {
    if (autoScroll && verseRefs.current[verseNumber - 1]) {
      verseRefs.current[verseNumber - 1]?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }
  };

  const handleAudioPlay = (verseNumber: number, audioUrl: string) => {
    if (playingVerse === verseNumber) {
      audioRef.current?.pause();
      setPlayingVerse(null);
    } else {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      audioRef.current = new Audio(audioUrl);
      audioRef.current.play();
      setPlayingVerse(verseNumber);
      scrollToVerse(verseNumber);

      audioRef.current.onended = () => {
        setPlayingVerse(null);
        if (autoScroll && verseNumber < verses.length) {
          const nextVerseNumber = verseNumber + 1;
          handleAudioPlay(nextVerseNumber, verses[nextVerseNumber - 1].audio);
        }
      };
    }
  };

  return (
    <div className="min-h-screen bg-background islamic-pattern">
      <div className="max-w-4xl mx-auto p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 sm:mb-8">
          {/* Logo and Title */}
          <div className="flex items-center gap-3">
            <div className="p-2 bg-secondary/10 rounded-full">
              <Book className="h-6 w-6 sm:h-8 sm:w-8 text-secondary" />
            </div>
            <h1 className="text-2xl sm:text-4xl font-decorative font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              E-Tarteel
            </h1>
          </div>

          {/* Controls */}
          <div className="flex flex-wrap items-center gap-2">
            <Select
              value={language}
              onValueChange={(value: Language) => setLanguage(value)}
            >
              <SelectTrigger className="w-[120px] h-9">
                <Languages className="mr-2 h-4 w-4" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="en">English</SelectItem>
                <SelectItem value="id">Indonesia</SelectItem>
              </SelectContent>
            </Select>

            <div className="flex items-center space-x-2">
              <Switch
                id="auto-scroll"
                checked={autoScroll}
                onCheckedChange={setAutoScroll}
              />
              <Label htmlFor="auto-scroll" className="text-xs sm:text-sm">
                Auto-Scroll
              </Label>
            </div>

            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="rounded-full"
            >
              {theme === "dark" ? (
                <Sun className="h-4 w-4 sm:h-5 sm:w-5" />
              ) : (
                <Moon className="h-4 w-4 sm:h-5 sm:w-5" />
              )}
            </Button>
          </div>
        </div>

        <Card className="mb-6 sm:mb-8 animate-scale-in bg-card/50 backdrop-blur-sm">
          <CardContent className="p-4">
            <Select value={selectedSurah} onValueChange={setSelectedSurah}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select a Surah" />
              </SelectTrigger>
              <SelectContent>
                {surahs.map((surah) => (
                  <SelectItem
                    key={surah.number}
                    value={surah.number.toString()}
                  >
                    {surah.number}. {surah.englishName} ({surah.name})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-secondary" />
          </div>
        ) : (
          <ScrollArea className="h-[calc(100vh-200px)] sm:h-[calc(100vh-250px)] rounded-2xl border bg-card/50 backdrop-blur-sm">
            <div
              className="p-4 sm:p-6 space-y-4 sm:space-y-6"
              ref={scrollAreaRef}
            >
              {verses.map((verse, index) => (
                <Card
                  key={verse.number}
                  ref={(el) => (verseRefs.current[index] = el)}
                  className={`animate-fade-in border-secondary/20 hover:border-secondary/40 transition-colors ${
                    playingVerse === verse.number ? "ring-2 ring-secondary" : ""
                  }`}
                  style={{
                    animationDelay: `${index * 100}ms`,
                  }}
                >
                  <CardContent className="p-4 sm:p-6">
                    <div className="flex justify-between items-center mb-4 sm:mb-6">
                      <span className="text-xs sm:text-sm font-medium px-2 sm:px-3 py-1 rounded-full bg-secondary/10 text-secondary">
                        Verse {verse.number}
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="rounded-full hover:bg-secondary/10 transition-colors"
                        onClick={() =>
                          handleAudioPlay(verse.number, verse.audio)
                        }
                      >
                        {playingVerse === verse.number ? (
                          <Pause className="h-4 w-4 sm:h-5 sm:w-5 text-secondary" />
                        ) : (
                          <Volume2 className="h-4 w-4 sm:h-5 sm:w-5 text-secondary" />
                        )}
                      </Button>
                    </div>
                    <div className="verse-decoration">
                      <p className="text-2xl sm:text-3xl mb-4 sm:mb-6 text-right font-arabic leading-loose">
                        {verse.text}
                      </p>
                    </div>
                    <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                      {verse.translations[language]}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </ScrollArea>
        )}
        <footer className="mt-6 text-center pb-4">
          <p className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
            Dibuat oleh Bintang Syafrian atas Izin Allah SWT.
            <Heart className="h-4 w-4 text-red-500 fill-red-500 animate-heartbeat" />
          </p>
        </footer>
      </div>
    </div>
  );
}
