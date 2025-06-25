import { useState, useRef, useEffect } from 'react';
import { Upload, X  } from 'lucide-react';
import { FaSpinner } from 'react-icons/fa';

const ImageUpload = ({ maxImages = 5, singleImage = false, setImages, images = '' }) => {
  const [internalImages, setInternalImages] = useState(singleImage ? '' : []);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);

  // Sync internalImages with external images prop
  useEffect(() => {
    setInternalImages(singleImage ? images || '' : images || []);
  }, [images, singleImage]);

  const uploadImage = async (file) => {
    const formData = new FormData();
    formData.append('images', file);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/product-service/upload`, {
        method: 'POST',
        body: formData,
        headers: {
          'ngrok-skip-browser-warning': 'true',
        },
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Không thể tải lên hình ảnh');
      }
      return data.files[0].url;
    } catch (err) {
      throw new Error('Không thể tải lên hình ảnh: ' + err.message);
    }
  };

  const handleFileChange = async (e) => {
    const files = Array.from(e.target.files);
    if (singleImage && files.length > 1) {
      setError('Chỉ được tải lên 1 hình ảnh.');
      return;
    }
    if (!singleImage && internalImages.length + files.length > maxImages) {
      setError(`Không được tải lên quá ${maxImages} hình ảnh.`);
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const uploadedUrls = await Promise.all(files.map(file => uploadImage(file)));

      let newImages;
      if (singleImage) {
        newImages = uploadedUrls[0] || ''; // Single URL for thumbnail
      } else {
        newImages = [...internalImages, ...uploadedUrls]; // Array for multiple images
      }

      setInternalImages(newImages);
      setImages(newImages);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const removeImage = (index) => {
    if (singleImage) {
      setInternalImages('');
      setImages('');
    } else {
      const newImages = internalImages.filter((_, i) => i !== index);
      setInternalImages(newImages);
      setImages(newImages);
    }
    setError('');
  };

  return (
    <div className="w-full max-w-lg p-6 bg-white rounded-xl shadow-lg">
      <h3 className="text-xl font-bold mb-4 text-gray-800">
        {singleImage ? 'Tải lên hình ảnh' : `Tải lên hình ảnh (Tối đa ${maxImages})`}
      </h3>

      <div className="relative">
        <label
          htmlFor={`file-upload-${singleImage ? 'thumbnail' : 'images'}`}
          className={`flex items-center justify-center w-full p-4 border-2 border-dashed rounded-lg transition-all duration-300 ${
            isLoading || (!singleImage && internalImages.length >= maxImages)
              ? 'border-gray-300 bg-gray-100 cursor-not-allowed'
              : 'border-blue-400 bg-blue-50 hover:bg-blue-100 cursor-pointer'
          }`}
        >
          <input
            id={`file-upload-${singleImage ? 'thumbnail' : 'images'}`}
            type="file"
            accept="image/*"
            multiple={!singleImage}
            onChange={handleFileChange}
            ref={fileInputRef}
            className="hidden"
            disabled={isLoading || (!singleImage && internalImages.length >= maxImages)}
          />
          <div className="flex items-center space-x-2">
            <Upload className="w-6 h-6 text-blue-600" />
            <span className="text-sm font-medium text-gray-700">
              {singleImage ? 'Chọn hình ảnh' : 'Chọn hình ảnh (kéo thả hoặc nhấp)'}
            </span>
          </div>
        </label>
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-100 bg-opacity-75 rounded-lg">
            <FaSpinner className="w-6 h-6 text-blue-600 animate-spin" />
          </div>
        )}
      </div>

      {error && (
        <p className="mt-3 text-sm text-red-600 font-medium bg-red-50 p-2 rounded-md">
          {error}
        </p>
      )}

      {internalImages && (singleImage ? internalImages : internalImages.length > 0) && (
        <div className="mt-6 grid grid-cols-2 sm:grid-cols-3 gap-4">
          {(singleImage ? [internalImages] : internalImages).map((url, index) =>
            url ? (
              <div
                key={index}
                className="relative group rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-shadow"
              >
                <img
                  src={url}
                  alt={`Hình ảnh ${index + 1}`}
                  className="w-full h-32 object-cover"
                />
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    removeImage(index);
                  }}
                  className="absolute top-2 right-2 bg-red-600 text-white rounded-full w-8 h-8 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                  title="Xóa hình ảnh"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            ) : null
          )}
        </div>
      )}
    </div>
  );
};

export default ImageUpload;