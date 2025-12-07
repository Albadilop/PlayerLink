import React, { useState, useMemo } from "react";
import type { Review } from "../../types";
import "./ProfileReviewsTab.css";

export interface ProfileReviewsTabProps {
  reviews: Review[];
  showLeaveCommentButton?: boolean;
}

const REVIEWS_PER_PAGE = 3;

const renderStars = (stars: number) => {
  return [...Array(5)].map((_, i) => (
    <i
      key={i}
      className={`fa-star ${i < stars ? "fa-solid text-warning" : "fa-regular"}`}
      style={i >= stars ? { color: "#ffc107", opacity: 0.5 } : undefined}
    ></i>
  ));
};

export const ProfileReviewsTab: React.FC<ProfileReviewsTabProps> = ({
  reviews,
  showLeaveCommentButton = false,
}) => {
  // Asegurar que reviews sea un array
  const safeReviews = useMemo(() => {
    return Array.isArray(reviews) ? reviews : [];
  }, [reviews]);

  const [currentPage, setCurrentPage] = useState(1);

  // Calcular paginación
  const paginationData = useMemo(() => {
    const totalPages = Math.ceil(safeReviews.length / REVIEWS_PER_PAGE);
    const startIndex = (currentPage - 1) * REVIEWS_PER_PAGE;
    const endIndex = startIndex + REVIEWS_PER_PAGE;
    const currentReviews = safeReviews.slice(startIndex, endIndex);

    return {
      currentReviews,
      totalPages,
      startIndex,
      endIndex,
    };
  }, [safeReviews, currentPage]);

  // Resetear a página 1 cuando cambian los reviews
  React.useEffect(() => {
    setCurrentPage(1);
  }, [safeReviews.length]);

  const handlePrevious = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleNext = () => {
    if (currentPage < paginationData.totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const handlePageClick = (page: number) => {
    setCurrentPage(page);
  };

  // Generar números de página a mostrar
  const getPageNumbers = () => {
    const totalPages = paginationData.totalPages;
    const pages: (number | string)[] = [];

    if (totalPages <= 7) {
      // Si hay 7 o menos páginas, mostrar todas
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Si hay más de 7 páginas, mostrar con elipsis
      if (currentPage <= 3) {
        // Al inicio
        for (let i = 1; i <= 4; i++) {
          pages.push(i);
        }
        pages.push("...");
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        // Al final
        pages.push(1);
        pages.push("...");
        for (let i = totalPages - 3; i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
        // En el medio
        pages.push(1);
        pages.push("...");
        for (let i = currentPage - 1; i <= currentPage + 1; i++) {
          pages.push(i);
        }
        pages.push("...");
        pages.push(totalPages);
      }
    }

    return pages;
  };

  return (
    <div className="info-section container">
      <div className="row justify-content-between align-items-center mb-3">
        <div className="col-auto">
          <h3 className="m-0">Comments</h3>
        </div>
        {showLeaveCommentButton && (
          <div className="col-auto">
            <button
              type="button"
              className="btn botonLeaveComment"
              data-bs-toggle="modal"
              data-bs-target="#commentModal"
            >
              Leave a new comment
            </button>
          </div>
        )}
      </div>
      <div className="row">
        {safeReviews && safeReviews.length > 0 ? (
          <>
            {paginationData.currentReviews.map((review) => (
              <div key={review.id} className="review-card">
                <div className="review-container">
                  <div className="review-header">
                    <span className="review-author">{review.author_nickname}</span>
                    <div className="review-stars">{renderStars(review.stars)}</div>
                  </div>
                  <p className="m-0 border-0 review-box">
                    <span className="fa-solid fa-comment"></span>
                    {review.comment}
                  </p>
                </div>
              </div>
            ))}

            {/* Controles de paginación */}
            {paginationData.totalPages > 1 && (
              <div className="pagination-container">
                <button
                  className="pagination-btn"
                  onClick={handlePrevious}
                  disabled={currentPage === 1}
                  aria-label="Página anterior"
                >
                  <i className="fa-solid fa-chevron-left"></i> Previous
                </button>

                <div className="pagination-numbers">
                  {getPageNumbers().map((page, index) => {
                    if (page === "...") {
                      return (
                        <span key={`ellipsis-${index}`} className="pagination-ellipsis">
                          ...
                        </span>
                      );
                    }
                    return (
                      <button
                        key={page}
                        className={`pagination-number ${currentPage === page ? "active" : ""}`}
                        onClick={() => handlePageClick(page as number)}
                        aria-label={`Ir a página ${page}`}
                      >
                        {page}
                      </button>
                    );
                  })}
                </div>

                <button
                  className="pagination-btn"
                  onClick={handleNext}
                  disabled={currentPage === paginationData.totalPages}
                  aria-label="Página siguiente"
                >
                  Next <i className="fa-solid fa-chevron-right"></i>
                </button>
              </div>
            )}

            {/* Información de paginación */}
            {paginationData.totalPages > 1 && (
              <div className="pagination-info">
                Showing {paginationData.startIndex + 1} -{" "}
                {Math.min(paginationData.endIndex, safeReviews.length)} of {safeReviews.length}{" "}
                comments
              </div>
            )}
          </>
        ) : (
          <div className="reviews-empty-state">
            <div className="reviews-empty-state-icon">
              <i className="fa-solid fa-comments"></i>
            </div>
            <p className="reviews-empty-state-text">No comments yet.</p>
          </div>
        )}
      </div>
    </div>
  );
};
