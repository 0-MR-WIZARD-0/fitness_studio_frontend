import { Container, Grid } from "@/components/Container";
import { Reveal } from "@/components/Reveal";
import { SubmitReview } from "@/components/reviews/SubmitReview";
import { getApprovedReviews, mediaUrl, type Review } from "@/lib/api";

export const metadata = { title: "Отзывы — Триединство" };

export default async function ReviewsPage() {
  let reviews: Review[] = [];
  try {
    reviews = await getApprovedReviews();
  } catch {
  }

  return (
    <div className="pt-28 pb-10">
      <Container>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h1 className="text-5xl md:text-7xl font-bold">Отзывы</h1>
          <SubmitReview />
        </div>

        {reviews.length === 0 ? (
          <p className="mt-10 text-text/70">
            Пока нет одобренных отзывов. Станьте первой!
          </p>
        ) : (
          <Reveal>
            <Grid className="mt-10">
              {reviews.map((r) => (
                <ReviewCard key={r.id} review={r} />
              ))}
            </Grid>
          </Reveal>
        )}
      </Container>
    </div>
  );
}

function ReviewCard({ review }: { review: Review }) {
  const media = mediaUrl(review.mediaUrl);
  return (
    <div className="col-span-12 md:col-span-6 lg:col-span-4 rounded-2xl border-gold bg-surface/60 p-6">
      {media && review.mediaType === "IMAGE" && (
        <img
          src={media}
          alt=""
          className="mb-4 h-48 w-full rounded-xl object-cover"
        />
      )}
      {media && review.mediaType === "VIDEO" && (
        <video
          src={media}
          controls
          className="mb-4 h-48 w-full rounded-xl object-cover"
        />
      )}
      <div className="flex items-center justify-between">
        <p className="font-sub text-heading">{review.authorName}</p>
        {review.rating != null && (
          <p className="text-accent">{"★".repeat(review.rating)}</p>
        )}
      </div>
      <p className="mt-2 text-sm leading-relaxed text-text/90">{review.text}</p>
    </div>
  );
}
