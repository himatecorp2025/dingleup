import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Upload, Trash2, Eye, EyeOff, Save, ArrowLeft, MoveUp, MoveDown } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

interface Video {
  id: string;
  title: string;
  description: string | null;
  thumb_url: string;
  video_url: string;
  duration_sec: number | null;
  is_active: boolean;
  sort_order: number;
  published_at: string;
}

const AdminTipsVideos = () => {
  const navigate = useNavigate();
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [thumbFile, setThumbFile] = useState<File | null>(null);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [isActive, setIsActive] = useState(true);

  useEffect(() => {
    checkAdmin();
    fetchVideos();
  }, []);

  const checkAdmin = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate('/admin');
      return;
    }

    const { data: roles } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'admin');

    if (!roles || roles.length === 0) {
      navigate('/admin');
    }
  };

  const fetchVideos = async () => {
    try {
      const { data, error } = await supabase
        .from('tips_tricks_videos')
        .select('*')
        .order('sort_order', { ascending: true });

      if (error) throw error;
      setVideos(data || []);
    } catch (error: any) {
      console.error('Error fetching videos:', error);
      toast.error('Hiba a videók betöltésekor');
    } finally {
      setLoading(false);
    }
  };

  const uploadFile = async (file: File, bucket: string, path: string): Promise<string> => {
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(path, file, { upsert: true });

    if (error) throw error;

    const { data: { publicUrl } } = supabase.storage
      .from(bucket)
      .getPublicUrl(path);

    return publicUrl;
  };

  const getVideoDuration = (file: File): Promise<number> => {
    return new Promise((resolve) => {
      const video = document.createElement('video');
      video.preload = 'metadata';
      video.onloadedmetadata = () => {
        window.URL.revokeObjectURL(video.src);
        resolve(Math.floor(video.duration));
      };
      video.src = URL.createObjectURL(file);
    });
  };

  const handleUpload = async () => {
    if (!title || !thumbFile || !videoFile) {
      toast.error('Kérlek töltsd ki az összes mezőt');
      return;
    }

    setUploading(true);
    try {
      // Upload thumbnail
      const thumbPath = `thumbnails/${Date.now()}_${thumbFile.name}`;
      const thumbUrl = await uploadFile(thumbFile, 'tips-videos', thumbPath);

      // Upload video
      const videoPath = `videos/${Date.now()}_${videoFile.name}`;
      const videoUrl = await uploadFile(videoFile, 'tips-videos', videoPath);

      // Get video duration
      const durationSec = await getVideoDuration(videoFile);

      // Get next sort_order
      const maxOrder = videos.length > 0 ? Math.max(...videos.map(v => v.sort_order)) : 0;

      // Insert into database
      const { error } = await supabase
        .from('tips_tricks_videos')
        .insert({
          title,
          description: description || null,
          thumb_url: thumbUrl,
          video_url: videoUrl,
          duration_sec: durationSec,
          is_active: isActive,
          sort_order: maxOrder + 1
        });

      if (error) throw error;

      toast.success('Videó sikeresen feltöltve!');
      
      // Reset form
      setTitle('');
      setDescription('');
      setThumbFile(null);
      setVideoFile(null);
      setIsActive(true);

      fetchVideos();
    } catch (error: any) {
      console.error('Error uploading video:', error);
      toast.error('Hiba a videó feltöltésekor');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (video: Video) => {
    if (!confirm(`Biztosan törölni szeretnéd: ${video.title}?`)) return;

    try {
      const { error } = await supabase
        .from('tips_tricks_videos')
        .delete()
        .eq('id', video.id);

      if (error) throw error;

      toast.success('Videó törölve');
      fetchVideos();
    } catch (error: any) {
      console.error('Error deleting video:', error);
      toast.error('Hiba a videó törlésekor');
    }
  };

  const handleToggleActive = async (video: Video) => {
    try {
      const { error } = await supabase
        .from('tips_tricks_videos')
        .update({ is_active: !video.is_active })
        .eq('id', video.id);

      if (error) throw error;

      toast.success(video.is_active ? 'Videó elrejtve' : 'Videó láthatóvá téve');
      fetchVideos();
    } catch (error: any) {
      console.error('Error toggling video:', error);
      toast.error('Hiba a videó módosításakor');
    }
  };

  const handleMove = async (video: Video, direction: 'up' | 'down') => {
    const currentIndex = videos.findIndex(v => v.id === video.id);
    if (
      (direction === 'up' && currentIndex === 0) ||
      (direction === 'down' && currentIndex === videos.length - 1)
    ) {
      return;
    }

    const swapIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    const swapVideo = videos[swapIndex];

    try {
      // Swap sort_order values
      await supabase
        .from('tips_tricks_videos')
        .update({ sort_order: swapVideo.sort_order })
        .eq('id', video.id);

      await supabase
        .from('tips_tricks_videos')
        .update({ sort_order: video.sort_order })
        .eq('id', swapVideo.id);

      toast.success('Sorrend módosítva');
      fetchVideos();
    } catch (error: any) {
      console.error('Error reordering videos:', error);
      toast.error('Hiba a sorrend módosításakor');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('hu-HU', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return '-';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-dvh min-h-svh bg-gradient-to-br from-primary-darker via-primary-dark to-primary-darker text-foreground p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              onClick={() => navigate('/admin')}
              variant="outline"
              className="border-foreground/30 text-foreground hover:bg-foreground/10"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Vissza
            </Button>
            <h1 className="text-3xl font-bold">Tippek & Trükkök Videók</h1>
          </div>
        </div>

        {/* Upload Form */}
        <Card className="bg-gradient-to-br from-primary-dark/90 to-primary-darker/90 border-2 border-primary/30">
          <CardHeader>
            <CardTitle className="text-foreground flex items-center gap-2">
              <Upload className="w-5 h-5" />
              Új Videó Feltöltése
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="title" className="text-foreground">Cím *</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Pl.: Hogyan nyerj minden játékban"
                className="bg-background/40 border-foreground/30 text-foreground"
              />
            </div>

            <div>
              <Label htmlFor="description" className="text-foreground">Leírás (opcionális)</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Rövid leírás a videóról..."
                className="bg-background/40 border-foreground/30 text-foreground"
              />
            </div>

            <div>
              <Label htmlFor="thumbnail" className="text-foreground">Borítókép *</Label>
              <Input
                id="thumbnail"
                type="file"
                accept="image/*"
                onChange={(e) => setThumbFile(e.target.files?.[0] || null)}
                className="bg-background/40 border-foreground/30 text-foreground"
              />
            </div>

            <div>
              <Label htmlFor="video" className="text-foreground">Videó fájl *</Label>
              <Input
                id="video"
                type="file"
                accept="video/*"
                onChange={(e) => setVideoFile(e.target.files?.[0] || null)}
                className="bg-background/40 border-foreground/30 text-foreground"
              />
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="active"
                checked={isActive}
                onCheckedChange={setIsActive}
              />
              <Label htmlFor="active" className="text-foreground">
                Publikálva (látható a felhasználóknak)
              </Label>
            </div>

            <Button
              onClick={handleUpload}
              disabled={uploading || !title || !thumbFile || !videoFile}
              className="w-full bg-gradient-to-r from-success to-success/80 hover:from-success/90 hover:to-success/70"
            >
              {uploading ? 'Feltöltés...' : 'Feltöltés'}
            </Button>
          </CardContent>
        </Card>

        {/* Videos List */}
        <Card className="bg-gradient-to-br from-primary-dark/90 to-primary-darker/90 border-2 border-primary/30">
          <CardHeader>
            <CardTitle className="text-foreground">Feltöltött Videók ({videos.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-muted-foreground">Betöltés...</p>
            ) : videos.length === 0 ? (
              <p className="text-muted-foreground">Még nincsenek feltöltött videók</p>
            ) : (
              <div className="space-y-4">
                {videos.map((video, index) => (
                  <div
                    key={video.id}
                    className="flex items-center gap-4 p-4 bg-black/40 rounded-lg border border-white/10"
                  >
                    {/* Thumbnail */}
                    <img
                      src={video.thumb_url}
                      alt={video.title}
                      className="w-32 h-20 object-cover rounded"
                    />

                    {/* Info */}
                    <div className="flex-1">
                      <h3 className="text-white font-bold">{video.title}</h3>
                      {video.description && (
                        <p className="text-white/60 text-sm">{video.description}</p>
                      )}
                      <div className="flex items-center gap-4 text-xs text-white/40 mt-1">
                        <span>Időtartam: {formatDuration(video.duration_sec)}</span>
                        <span>Publikálva: {formatDate(video.published_at)}</span>
                        <span className={video.is_active ? 'text-green-400' : 'text-red-400'}>
                          {video.is_active ? 'Aktív' : 'Inaktív'}
                        </span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleMove(video, 'up')}
                        disabled={index === 0}
                        className="text-white hover:bg-white/10"
                      >
                        <MoveUp className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleMove(video, 'down')}
                        disabled={index === videos.length - 1}
                        className="text-white hover:bg-white/10"
                      >
                        <MoveDown className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleToggleActive(video)}
                        className="text-white hover:bg-white/10"
                      >
                        {video.is_active ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDelete(video)}
                        className="text-red-400 hover:bg-red-500/10"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminTipsVideos;