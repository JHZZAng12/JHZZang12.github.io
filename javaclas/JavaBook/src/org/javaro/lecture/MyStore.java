package org.javaro.lecture;
import org.javaro.lecture.Book;
import org.javaro.lecture.BookStore;
import org.javaro.lecture.Student;
public class MyStore {

	public static void main(String[] args) {
		BookStore myStore = new BookStore("도서관");
		Book book1 = new Book("9788901161236","홍길도전");
		Book book2 = new Book("9788901162135","심청전");
		book1.setAuthor("허균"); book2.setAuthor("미상");
		Student stud1 = new Student("10201316");
		Student stud2 = new Student("20201316");
		stud1.setName("이몽룡"); stud2.setName("변학도");
		myStore.addBook(book1); myStore.addBook(book2);
		myStore.addStudent(stud1); myStore.addStudent(stud2);
		System.out.println("도서관리 시스템 생성");
		myStore.printStaus();
		System.out.println("book1 홍길동전을 stud2 변학도에게 대출");
		myStore.checkOut(book1, stud2);
		myStore.printStaus();
		System.out.println("book1 홍길동전 반납");
		myStore.checkln(book1);
		System.out.println("book2 심청전을 stud1 이몽룡에게 대출");
		myStore.checkOut(book2, stud1);
		myStore.printStaus();
		
		}

}
