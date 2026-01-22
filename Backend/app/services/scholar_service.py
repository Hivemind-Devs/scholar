from typing import List
from app.data_access.models import Publication

class ScholarService:
    @staticmethod
    def estimate_citation_count(publications: List[Publication]) -> int:
        if not publications:
            return 0
        
        total_citations = 0
        for pub in publications:
            base_citations = 5
            
            if pub.publication_index and 'SCI' in str(pub.publication_index).upper():
                base_citations = 20
            
            if pub.year:
                try:
                    year = int(pub.year.split('-')[0])
                    years_ago = 2024 - year
                    if years_ago > 0:
                        base_citations += years_ago * 2
                except (ValueError, AttributeError):
                    pass
            
            total_citations += base_citations
        
        return total_citations

    @staticmethod
    def calculate_h_index(publications: List[Publication]) -> int:
        if not publications:
            return 0
        
        estimated_citations = []
        for pub in publications:
            base_citations = 5
            if pub.publication_index and 'SCI' in str(pub.publication_index).upper():
                base_citations = 20
            if pub.year:
                try:
                    year = int(pub.year.split('-')[0])
                    years_ago = 2024 - year
                    if years_ago > 0:
                        base_citations += years_ago * 2
                except (ValueError, AttributeError):
                    pass
            estimated_citations.append(base_citations)
        
        estimated_citations.sort(reverse=True)
        
        h_index = 0
        for i, citations in enumerate(estimated_citations, 1):
            if citations >= i:
                h_index = i
            else:
                break
        
        return h_index

