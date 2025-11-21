import { Card } from "@/components/ui/card";
import { CheckCircle2, Circle, Clock } from "lucide-react";
import { useI18n } from "@/i18n";

const Roadmap = () => {
  const { t } = useI18n();
  
  const roadmapItems = [
    {
      title: t('landing.roadmap.phase1_title'),
      status: "completed",
      date: "2024 Q4",
      items: [
        t('landing.roadmap.phase1_item1'),
        t('landing.roadmap.phase1_item2'),
        t('landing.roadmap.phase1_item3'),
        t('landing.roadmap.phase1_item4'),
        t('landing.roadmap.phase1_item5')
      ]
    },
    {
      title: t('landing.roadmap.phase2_title'),
      status: "completed",
      date: "2025 Q1",
      items: [
        t('landing.roadmap.phase2_item1'),
        t('landing.roadmap.phase2_item2'),
        t('landing.roadmap.phase2_item3'),
        t('landing.roadmap.phase2_item4'),
        t('landing.roadmap.phase2_item5')
      ]
    },
    {
      title: t('landing.roadmap.phase3_title'),
      status: "in-progress",
      date: "2025 Q2",
      items: [
        t('landing.roadmap.phase3_item1'),
        t('landing.roadmap.phase3_item2'),
        t('landing.roadmap.phase3_item3'),
        t('landing.roadmap.phase3_item4'),
        t('landing.roadmap.phase3_item5')
      ]
    },
    {
      title: t('landing.roadmap.phase4_title'),
      status: "planned",
      date: "2025 Q3",
      items: [
        t('landing.roadmap.phase4_item1'),
        t('landing.roadmap.phase4_item2'),
        t('landing.roadmap.phase4_item3'),
        t('landing.roadmap.phase4_item4'),
        t('landing.roadmap.phase4_item5')
      ]
    },
    {
      title: t('landing.roadmap.phase5_title'),
      status: "planned",
      date: "2025 Q4",
      items: [
        t('landing.roadmap.phase5_item1'),
        t('landing.roadmap.phase5_item2'),
        t('landing.roadmap.phase5_item3'),
        t('landing.roadmap.phase5_item4'),
        t('landing.roadmap.phase5_item5')
      ]
    }
  ];
  
  const getStatusIcon = (status: string) => {
    if (status === "completed") return <CheckCircle2 className="w-6 h-6 text-success" />;
    if (status === "in-progress") return <Clock className="w-6 h-6 text-accent animate-pulse" />;
    return <Circle className="w-6 h-6 text-muted-foreground" />;
  };

  const getStatusColor = (status: string) => {
    if (status === "completed") return "border-success/50 bg-success/5";
    if (status === "in-progress") return "border-accent/50 bg-accent/5";
    return "border-border/50 bg-muted/20";
  };

  const getStatusLabel = (status: string) => {
    if (status === "completed") return t('landing.roadmap.status_completed');
    if (status === "in-progress") return t('landing.roadmap.status_progress');
    return t('landing.roadmap.status_planned');
  };

  return (
    <section className="py-24 px-4 relative bg-gradient-to-b from-background to-primary-dark/30">
      <div className="container mx-auto max-w-5xl">
        <div className="text-center mb-16 animate-fade-in">
          <h2 className="text-4xl md:text-5xl font-bold mb-4 font-poppins">
            {t('landing.roadmap.title_part1')} <span className="text-transparent bg-clip-text bg-gradient-gold">{t('landing.roadmap.title_part2')}</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            {t('landing.roadmap.subtitle')}
          </p>
        </div>

        <div className="relative">
          {/* Timeline line */}
          <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gradient-to-b from-success via-accent to-muted-foreground/30" />

          <div className="space-y-8">
            {roadmapItems.map((item, index) => (
              <Card
                key={index}
                className={`relative ml-20 p-6 transition-all duration-300 hover:scale-[1.02] animate-fade-in ${getStatusColor(item.status)}`}
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                {/* Timeline dot */}
                <div className="absolute -left-[4.5rem] top-6">
                  {getStatusIcon(item.status)}
                </div>

                {/* Header */}
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-2xl font-bold font-poppins mb-1">{item.title}</h3>
                    <p className="text-sm text-muted-foreground">{item.date}</p>
                  </div>
                  <span className={`text-xs font-bold px-3 py-1 rounded-full ${
                    item.status === 'completed' 
                      ? 'bg-green-400/20 text-green-400' 
                      : item.status === 'in-progress'
                      ? 'bg-accent/20 text-accent'
                      : 'bg-muted-foreground/20 text-muted-foreground'
                  }`}>
                    {getStatusLabel(item.status)}
                  </span>
                </div>

                {/* Items list */}
                <ul className="space-y-2">
                  {item.items.map((subItem, subIndex) => (
                    <li key={subIndex} className="flex items-start gap-2 text-sm">
                      <span className="text-accent mt-1">•</span>
                      <span className="text-muted-foreground">{subItem}</span>
                    </li>
                  ))}
                </ul>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default Roadmap;
