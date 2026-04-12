import React, { useState, useMemo } from "react";
import type { Review } from "../../types";
import "./ProfileReviewsTab.css";

export interface ProfileReviewsTabProps {
  reviews: Review[];
  showLeaveCommentButton?: boolean;
}

const REVIEWS_PER_PAGE = 4;

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
  // Asegurar que reviews sea un array y ordenarlos por fecha (más reciente primero)
  const safeReviews = useMemo(() => {
    const reviewsArray = Array.isArray(reviews) ? reviews : [];
    return [...reviewsArray].sort((a, b) => {
      // Ordenar del más reciente al más antiguo
      const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
      const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
      return dateB - dateA; // Orden descendente (más reciente primero)
    });
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
      <div className="row justify-content-between align-items-center mb-3 profile-tab-toolbar">
        <div className="col-auto">
          <h3 className="m-0 d-flex align-items-center gap-2 flex-wrap profile-tab-title">
            <span className="d-flex align-items-center gap-2">
              <i className="fa-solid fa-comments section-title-icon" aria-hidden />
              Comments
            </span>
          </h3>
        </div>
        {showLeaveCommentButton && (
          <div className="col-auto">
            <button
              type="button"
              className="btn botonLeaveComment"
              data-bs-toggle="modal"
              data-bs-target="#commentModal"
            >
              Leave a comment
            </button>
          </div>
        )}
      </div>
      <div className="reviews-content-area">
        <div className="reviews-cards-stack profile-tab-cards">
          {safeReviews && safeReviews.length > 0 ? (
            <>
              {paginationData.currentReviews.map((review) => {
                const formatDate = (dateString?: string) => {
                  if (!dateString) return "";
                  const date = new Date(dateString);
                  const now = new Date();
                  const diffTime = Math.abs(now.getTime() - date.getTime());
                  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

                  if (diffDays === 0) {
                    return "Today";
                  } else if (diffDays === 1) {
                    return "Yesterday";
                  } else if (diffDays < 7) {
                    return `${diffDays} days ago`;
                  } else {
                    return date.toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    });
                  }
                };

                return (
                  <div key={review.id} className="review-tile-card">
                    <div className="review-tile-body">
                      <div className="review-header">
                        <div className="review-header-left">
                          <span className="review-author">{review.author_nickname}</span>
                          {review.created_at && (
                            <span className="review-date">
                              <i className="fa-solid fa-clock"></i>
                              {formatDate(review.created_at)}
                            </span>
                          )}
                        </div>
                        <div className="review-stars">{renderStars(review.stars)}</div>
                      </div>
                      <div className="review-comment-line">
                        <i
                          className="me-2 fa-solid fa-comment-dots review-comment-line-icon"
                          aria-hidden
                        />
                        <span className="review-comment-line-text">{review.comment}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
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
      {/* Controles de paginación - al final de la tarjeta */}
      {safeReviews && safeReviews.length > 0 && paginationData.totalPages > 1 && (
        <div className="pagination-container">
          <button
            type="button"
            className="pagination-btn pagination-btn--prev"
            onClick={handlePrevious}
            disabled={currentPage === 1}
            aria-label="Página anterior"
          >
            <i className="fa-solid fa-chevron-left" aria-hidden />
            <span>Prev</span>
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
            type="button"
            className="pagination-btn pagination-btn--next"
            onClick={handleNext}
            disabled={currentPage === paginationData.totalPages}
            aria-label="Página siguiente"
          >
            <span>Next</span>
            <i className="fa-solid fa-chevron-right" aria-hidden />
          </button>
        </div>
      )}
    </div>
  );
};
