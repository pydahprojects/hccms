import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { BellRing, Plus, Pencil, Trash2, Eye, MessageSquare, Calendar, Image, X, Upload } from 'lucide-react';
import { getFirestore, collection, addDoc, getDocs, deleteDoc, doc, updateDoc, Timestamp, query, orderBy } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';

interface Announcement {
  id: string;
  title: string;
  content: string;
  category: string;
  publishDate: Date;
  createdAt: Date;
  updatedAt: Date;
  status: 'draft' | 'scheduled' | 'published';
  views: number;
  engagement: {
    comments: number;
    reactions: number;
  };
  imageUrl?: string;
}

interface CreateAnnouncementModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (announcement: Omit<Announcement, 'id' | 'views' | 'engagement'>) => void;
  initialData?: Announcement;
}

interface AnnouncementCardProps {
  announcement: Announcement;
  onEdit: (announcement: Announcement) => void;
  onDelete: (id: string) => void;
}

const categories = [
  'General',
  'Academic',
  'Events',
  'Maintenance',
  'Emergency',
  'Hostel',
  'Sports',
  'Other'
];

const db = getFirestore();
const storage = getStorage();

const CreateAnnouncementModal: React.FC<CreateAnnouncementModalProps> = ({ isOpen, onClose, onSubmit, initialData }) => {
  const [title, setTitle] = useState(initialData?.title || '');
  const [content, setContent] = useState(initialData?.content || '');
  const [category, setCategory] = useState(initialData?.category || categories[0]);
  const [publishDate, setPublishDate] = useState(
    initialData?.publishDate 
      ? new Date(initialData.publishDate).toISOString().split('T')[0] 
      : new Date().toISOString().split('T')[0]
  );
  const [status, setStatus] = useState<'draft' | 'scheduled' | 'published'>(initialData?.status || 'draft');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>(initialData?.imageUrl || '');
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        alert('Image size should be less than 5MB');
        return;
      }
      setImageFile(file);
      const previewUrl = URL.createObjectURL(file);
      setImagePreview(previewUrl);
    }
  };

  const handleRemoveImage = () => {
    setImageFile(null);
    setImagePreview('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUploading(true);
    const now = new Date();
    const publishDateTime = new Date(publishDate);

    try {
      let imageUrl = initialData?.imageUrl || '';

      // Handle image upload if there's a new image
      if (imageFile) {
        const storageRef = ref(storage, `announcements/${imageFile.name}_${Date.now()}`);
        await uploadBytes(storageRef, imageFile);
        imageUrl = await getDownloadURL(storageRef);

        // Delete old image if exists
        if (initialData?.imageUrl) {
          try {
            const oldImageRef = ref(storage, initialData.imageUrl);
            await deleteObject(oldImageRef);
          } catch (error) {
            console.error('Error deleting old image:', error);
          }
        }
      }

      await onSubmit({
        title,
        content,
        category,
        publishDate: publishDateTime,
        createdAt: initialData?.createdAt || now,
        updatedAt: now,
        status: publishDateTime > now ? 'scheduled' : 'published',
        imageUrl
      });

      setTitle('');
      setContent('');
      setCategory(categories[0]);
      setPublishDate(new Date().toISOString().split('T')[0]);
      setImageFile(null);
      setImagePreview('');
      onClose();
    } catch (error) {
      console.error('Error handling image upload:', error);
      alert('Failed to upload image. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4"
      >
        <h2 className="text-2xl font-bold text-gray-800 mb-4">
          {initialData ? 'Edit Announcement' : 'Create New Announcement'}
        </h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#F27528] focus:border-transparent"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Content</label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#F27528] focus:border-transparent min-h-[200px]"
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#F27528] focus:border-transparent"
              >
                {categories.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Publish Date</label>
              <input
                type="date"
                value={publishDate}
                onChange={(e) => setPublishDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#F27528] focus:border-transparent"
                min={new Date().toISOString().split('T')[0]}
              />
            </div>
          </div>

          {/* Image Upload Section */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Image</label>
            <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md relative">
              {imagePreview ? (
                <div className="relative">
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="max-h-48 rounded-md"
                  />
                  <button
                    type="button"
                    onClick={handleRemoveImage}
                    className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="space-y-1 text-center">
                  <Image className="mx-auto h-12 w-12 text-gray-400" />
                  <div className="flex text-sm text-gray-600">
                    <label className="relative cursor-pointer bg-white rounded-md font-medium text-[#F27528] hover:text-[#d65a0f] focus-within:outline-none">
                      <span>Upload an image</span>
                      <input
                        ref={fileInputRef}
                        type="file"
                        className="sr-only"
                        accept="image/*"
                        onChange={handleImageSelect}
                      />
                    </label>
                  </div>
                  <p className="text-xs text-gray-500">PNG, JPG, GIF up to 5MB</p>
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
              disabled={isUploading}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isUploading}
              className="px-4 py-2 text-sm font-medium text-white bg-[#F27528] hover:bg-[#d65a0f] rounded-md transition-colors flex items-center gap-2"
            >
              {isUploading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white" />
                  <span>Uploading...</span>
                </>
              ) : (
                <>
                  {initialData ? 'Update' : 'Create'} Announcement
                </>
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

const formatDate = (date: Date) => {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const AnnouncementCard: React.FC<AnnouncementCardProps> = ({ announcement, onEdit, onDelete }) => (
  <div className="bg-white rounded-lg shadow-md p-6">
    <div className="flex justify-between items-start mb-4">
      <div>
        <h3 className="text-xl font-semibold text-gray-800">{announcement.title}</h3>
        <p className="text-sm text-gray-500">
          {formatDate(announcement.publishDate)}
        </p>
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={() => onEdit(announcement)}
          className="p-2 text-gray-600 hover:bg-gray-100 rounded-full"
        >
          <Pencil className="w-5 h-5" />
        </button>
        <button
          onClick={() => onDelete(announcement.id)}
          className="p-2 text-red-600 hover:bg-red-50 rounded-full"
        >
          <Trash2 className="w-5 h-5" />
        </button>
      </div>
    </div>

    {announcement.imageUrl && (
      <div className="mb-4">
        <img
          src={announcement.imageUrl}
          alt={announcement.title}
          className="rounded-lg w-full h-48 object-cover"
        />
      </div>
    )}

    <p className="text-gray-600 mb-4 whitespace-pre-wrap">{announcement.content}</p>

    <div className="flex flex-wrap gap-4 items-center text-sm text-gray-500">
      <span className="flex items-center gap-1">
        <Calendar className="w-4 h-4" />
        {announcement.category}
      </span>
      <span className="flex items-center gap-1">
        <Eye className="w-4 h-4" />
        {announcement.views} views
      </span>
      <span className="flex items-center gap-1">
        <MessageSquare className="w-4 h-4" />
        {announcement.engagement.comments} comments
      </span>
      <span className={`px-2 py-1 rounded-full text-xs ${
        announcement.status === 'published' 
          ? 'bg-green-100 text-green-800'
          : announcement.status === 'scheduled'
          ? 'bg-yellow-100 text-yellow-800'
          : 'bg-gray-100 text-gray-800'
      }`}>
        {announcement.status.charAt(0).toUpperCase() + announcement.status.slice(1)}
      </span>
    </div>
  </div>
);

const AnnouncementsPage = () => {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<Announcement | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [sortBy, setSortBy] = useState<'date' | 'views' | 'engagement'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const fetchAnnouncements = async () => {
    try {
      const q = query(collection(db, 'announcements'), orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      const announcementsData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        publishDate: doc.data().publishDate.toDate(),
        createdAt: doc.data().createdAt.toDate(),
        updatedAt: doc.data().updatedAt.toDate()
      })) as Announcement[];
      
      setAnnouncements(announcementsData);
    } catch (error) {
      console.error('Error fetching announcements:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAnnouncement = async (announcementData: Omit<Announcement, 'id' | 'views' | 'engagement'>) => {
    try {
      const docRef = await addDoc(collection(db, 'announcements'), {
        ...announcementData,
        publishDate: Timestamp.fromDate(announcementData.publishDate),
        createdAt: Timestamp.fromDate(announcementData.createdAt),
        updatedAt: Timestamp.fromDate(announcementData.updatedAt),
        views: 0,
        engagement: {
          comments: 0,
          reactions: 0
        }
      });
      
      fetchAnnouncements();
    } catch (error) {
      console.error('Error creating announcement:', error);
    }
  };

  const handleUpdateAnnouncement = async (announcementData: Omit<Announcement, 'id' | 'views' | 'engagement'>) => {
    if (!selectedAnnouncement) return;

    try {
      await updateDoc(doc(db, 'announcements', selectedAnnouncement.id), {
        ...announcementData,
        publishDate: Timestamp.fromDate(announcementData.publishDate),
        updatedAt: Timestamp.fromDate(announcementData.updatedAt)
      });
      
      setSelectedAnnouncement(null);
      fetchAnnouncements();
    } catch (error) {
      console.error('Error updating announcement:', error);
    }
  };

  const handleDeleteAnnouncement = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this announcement?')) return;

    try {
      await deleteDoc(doc(db, 'announcements', id));
      fetchAnnouncements();
    } catch (error) {
      console.error('Error deleting announcement:', error);
    }
  };

  const getFilteredAndSortedAnnouncements = () => {
    let filtered = [...announcements];

    if (selectedCategory) {
      filtered = filtered.filter(a => a.category === selectedCategory);
    }

    if (selectedStatus) {
      filtered = filtered.filter(a => a.status === selectedStatus);
    }

    filtered.sort((a, b) => {
      if (sortBy === 'date') {
        return sortOrder === 'desc' 
          ? b.publishDate.getTime() - a.publishDate.getTime()
          : a.publishDate.getTime() - b.publishDate.getTime();
      }
      if (sortBy === 'views') {
        return sortOrder === 'desc' 
          ? b.views - a.views
          : a.views - b.views;
      }
      return sortOrder === 'desc'
        ? (b.engagement.comments + b.engagement.reactions) - (a.engagement.comments + a.engagement.reactions)
        : (a.engagement.comments + a.engagement.reactions) - (b.engagement.comments + b.engagement.reactions);
    });

    return filtered;
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Announcements</h2>
        <button 
          onClick={() => setIsCreateModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-[#F27528] text-white rounded-lg hover:bg-[#d65a0f] transition-colors"
        >
          <Plus className="w-5 h-5" />
          <span>Create Announcement</span>
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#F27528] focus:border-transparent"
            >
              <option value="">All Categories</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#F27528] focus:border-transparent"
            >
              <option value="">All Status</option>
              <option value="draft">Draft</option>
              <option value="scheduled">Scheduled</option>
              <option value="published">Published</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Sort By</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'date' | 'views' | 'engagement')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#F27528] focus:border-transparent"
            >
              <option value="date">Date</option>
              <option value="views">Views</option>
              <option value="engagement">Engagement</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Order</label>
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value as 'asc' | 'desc')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#F27528] focus:border-transparent"
            >
              <option value="desc">Descending</option>
              <option value="asc">Ascending</option>
            </select>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#F27528]"></div>
        </div>
      ) : announcements.length === 0 ? (
        <div className="text-center py-12">
          <BellRing className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-medium text-gray-900">No Announcements Yet</h3>
          <p className="text-gray-500 mt-2">Create your first announcement to get started.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {getFilteredAndSortedAnnouncements().map((announcement) => (
            <AnnouncementCard
              key={announcement.id}
              announcement={announcement}
              onEdit={setSelectedAnnouncement}
              onDelete={handleDeleteAnnouncement}
            />
          ))}
        </div>
      )}

      <CreateAnnouncementModal
        isOpen={isCreateModalOpen || !!selectedAnnouncement}
        onClose={() => {
          setIsCreateModalOpen(false);
          setSelectedAnnouncement(null);
        }}
        onSubmit={selectedAnnouncement ? handleUpdateAnnouncement : handleCreateAnnouncement}
        initialData={selectedAnnouncement || undefined}
      />
    </div>
  );
};

export default AnnouncementsPage; 